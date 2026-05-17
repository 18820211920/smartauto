/**
 * AI对话API - Phase 2 Final
 * 支持真流式SSE、多模型切换、Token统计
 * 策略B: Node层直接集成LLM (无Python依赖)
 */
import http from './http';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  session_id?: string;
  message?: string;
  messages?: AIMessage[];
  model_id?: number;
  model_code?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  latency_ms: number;
}

export interface AIModel {
  id: number | string;
  model_name: string;
  model_code: string;
  provider: 'openai' | 'deepseek' | 'openrouter' | 'aliyun' | 'internal' | 'mock' | string;
  api_endpoint?: string;
  max_tokens: number;
  temperature?: number;
  cost_per_input: number;
  cost_per_output: number;
  is_default: boolean;
  status: number | string;
  model_version?: string;
  free?: boolean;
}

// ========== 模型管理 ==========
export async function listModels(): Promise<AIModel[]> {
  try {
    const res: any = await http.get('/ai/model/list');
    return res?.data?.list || res?.list || [];
  } catch (e) {
    console.warn('[AI API] listModels failed, using mock:', e.message);
    // Mock兜底：确保前端有模型可用
    return getDefaultModels();
  }
}

function getDefaultModels(): AIModel[] {
  return [
    { id: 'mock-deepseek', model_name: 'DeepSeek-V2.5', model_code: 'deepseek-chat', provider: 'deepseek', max_tokens: 4096, cost_per_input: 0, cost_per_output: 0, is_default: true, status: 1, free: true },
    { id: 'mock-openrouter', model_name: 'MiniMax-M2.5 (免费)', model_code: 'minimax/minimax-m2.5:free', provider: 'openrouter', max_tokens: 4096, cost_per_input: 0, cost_per_output: 0, is_default: false, status: 1, free: true },
    { id: 'mock-qwen', model_name: '通义千问 Turbo', model_code: 'qwen-turbo', provider: 'aliyun', max_tokens: 4096, cost_per_input: 0, cost_per_output: 0, is_default: false, status: 1, free: true },
    { id: 'mock-rule-engine', model_name: '智能规则引擎', model_code: 'rule-engine', provider: 'internal', max_tokens: 800, cost_per_input: 0, cost_per_output: 0, is_default: false, status: 1, free: true },
  ];
}

// 保存模型配置
export async function saveModels(models: AIModel[]): Promise<void> {
  await http.post('/ai/model/save', { models });
}

// ========== 核心对话方法 ==========
/**
 * 流式对话 - 真SSE实现
 * @param request 请求参数
 * @param onChunk 每个chunk回调
 * @param onComplete 完成回调(含usage/cost)
 * @returns sessionId
 */
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onComplete?: (usage: any, cost: number) => void
): Promise<string> {
  const modelCode = request.model_code || 'deepseek-chat';
  
  // 构建消息体
  const messages = request.messages?.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  })) || (request.message ? [{ role: 'user', content: request.message }] : []);

  if (messages.length === 0) {
    throw new Error('消息内容不能为空');
  }

  return new Promise(async (resolve, reject) => {
    try {
      // 构造SSE请求
      const response = await fetch('/smartauto-api/ai/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          session_id: request.session_id,
          messages,
          model_code: modelCode,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法获取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let sessionId = request.session_id || '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const text = line.slice(6).trim();
          if (!text) continue;

          try {
            const data = JSON.parse(text);

            if (data.type === 'session_id') {
              sessionId = data.session_id;
            } else if (data.type === 'chunk') {
              fullReply += data.content;
              onChunk(data.content);
            } else if (data.type === 'done') {
              // 完整回复
              fullReply = data.reply || fullReply;
              onComplete?.(data.usage, data.cost || 0);
              sessionId = data.session_id || sessionId;
            } else if (data.type === 'error') {
              throw new Error(data.error || 'AI服务异常');
            }
          } catch (e) {
            // JSON解析失败，忽略该行
          }
        }
      }

      // 处理剩余buffer
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.type === 'done') {
            onComplete?.(data.usage, data.cost || 0);
          }
        } catch (_) {}
      }

      resolve(sessionId);
    } catch (e: any) {
      console.error('[AI API] stream error:', e);
      reject(e);
    }
  });
}

// ========== 非流式对话（备用） ==========
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const res: any = await http.post('/ai/chat/send', {
    session_id: request.session_id,
    messages: request.messages?.map(m => ({ role: m.role, content: m.content })),
    model_code: request.model_code,
    stream: false,
  });

  return {
    session_id: res.data?.session_id || '',
    message: res.data?.message || '',
    model: res.data?.model || '',
    usage: res.data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    cost: res.data?.cost || 0,
    latency_ms: res.data?.latency || 0,
  };
}

// ========== 会话管理 ==========
export async function getChatHistory(sessionId: string): Promise<AIMessage[]> {
  try {
    const res: any = await http.get(`/ai/session/${sessionId}/messages`);
    return (res.data?.list || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.created_at
    }));
  } catch (e) {
    console.warn('[AI API] getChatHistory failed:', e.message);
    return [];
  }
}

export async function listSessions(page = 1, pageSize = 20): Promise<{ items: any[], total: number }> {
  try {
    const res: any = await http.get('/ai/session/list', { params: { page, pageSize } });
    return { items: res.data?.list || [], total: res.data?.total || 0 };
  } catch (e) {
    return { items: [], total: 0 };
  }
}

export async function createSession(title?: string, modelCode?: string): Promise<string> {
  const res: any = await http.post('/ai/session/create', { title, model_code: modelCode });
  return res.data?.session_id || '';
}

export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`/ai/session/${sessionId}/delete`);
}

// ========== Token统计 ==========
export async function getUsageStats(): Promise<any> {
  try {
    const res: any = await http.get('/ai/stats/usage');
    return res.data || { total_tokens: 0, total_cost: 0, session_count: 0, today_tokens: 0 };
  } catch (e) {
    return { total_tokens: 0, total_cost: 0, session_count: 0, today_tokens: 0 };
  }
}

export async function getAIStatus(): Promise<any> {
  try {
    const res: any = await http.get('/ai/status');
    return res.data || {};
  } catch (e) {
    return { status: 'unknown', mode: '离线' };
  }
}

// ========== Phase1: RAG知识库 API ==========
export interface AIKnowledge {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags?: string;
  hit_count: number;
  status: string;
  created_at?: string;
}

export async function listKnowledge(params?: {
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ list: AIKnowledge[]; total: number }> {
  try {
    const res: any = await http.get('/ai/knowledge/list', { params });
    return { list: res.data?.list || [], total: res.data?.total || 0 };
  } catch (e) {
    return { list: [], total: 0 };
  }
}

export async function addKnowledge(data: {
  category?: string;
  question: string;
  answer: string;
  tags?: string;
}): Promise<string> {
  const res: any = await http.post('/ai/knowledge/add', data);
  return res.data?.id || '';
}

export async function updateKnowledge(
  id: string,
  data: Partial<{ category: string; question: string; answer: string; tags: string; status: string }>
): Promise<void> {
  await http.put(`/ai/knowledge/${id}`, data);
}

export async function deleteKnowledge(id: string): Promise<void> {
  await http.delete(`/ai/knowledge/${id}`);
}

// 同步业务数据到知识库
export async function syncKnowledgeToBusiness(type?: 'projects' | 'customers' | 'all'): Promise<{ syncCount: number }> {
  const res: any = await http.post('/ai/knowledge/sync', { type });
  return { syncCount: res.data?.syncCount || 0 };
}

// ========== Phase2: AI工具调用 API ==========
export interface AITool {
  id: string;
  tool_name: string;
  tool_code: string;
  description: string;
  category: string;
  parameters?: string;
}

export async function listTools(): Promise<{ list: AITool[]; total: number }> {
  try {
    const res: any = await http.get('/ai/tools/list');
    return { list: res.data?.list || [], total: res.data?.total || 0 };
  } catch (e) {
    return { list: [], total: 0 };
  }
}

export async function executeTool(toolCode: string, params?: object): Promise<any> {
  const res: any = await http.post('/ai/tools/execute', { tool_code: toolCode, params });
  return res.data || {};
}

// ========== Phase3: 会话上下文恢复 ==========
export async function getSessionContext(sessionId: string): Promise<{
  session: any;
  messages: AIMessage[];
}> {
  try {
    const res: any = await http.get(`/ai/session/${sessionId}/context`);
    return {
      session: res.data?.session || {},
      messages: (res.data?.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      })),
    };
  } catch (e) {
    return { session: {}, messages: [] };
  }
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await http.put(`/ai/session/${sessionId}/title`, { title });
}

// ========== 辅助函数 ==========
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('smartauto-auth');
  if (!token) return {};
  try {
    const stored = JSON.parse(token);
    if (stored.state?.token) {
      return { 'Authorization': `Bearer ${stored.state.token}` };
    }
  } catch (_) {}
  return {};
}
