/**
 * AI对话API - Phase 2
 * 支持流式SSE、多模型切换、Token统计
 */
import http from './http';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  session_id?: string;
  messages: AIMessage[];
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
  id: number;
  model_name: string;
  model_code: string;
  provider: 'openai' | 'claude' | 'local' | 'mock';
  api_endpoint?: string;
  max_tokens: number;
  temperature: number;
  cost_per_input: number;
  cost_per_output: number;
  is_default: boolean;
  status: number;
}

// 获取模型列表
export async function listModels(): Promise<AIModel[]> {
  const res = await http.get('/ai/model/list');
  return res.data?.items || [];
}

// 发送消息（非流式，后端返回完整内容）
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onComplete?: (usage: any, cost: number) => void
): Promise<string> {
  // 修复：路径从 /api/v1/ai/chat/send → /api/ai/chat/send
  const res: any = await http.post('/ai/chat/send', {
    session_id: request.session_id,
    messages: request.messages.map(m => ({ role: m.role, content: m.content })),
    model_code: request.model_code || 'mock-gpt',
  });

  const sessionId = res.data?.session_id || '';
  const message = res.data?.message || '';
  const usage = res.data?.usage;
  const cost = res.data?.cost || 0;

  // 模拟逐字输出效果（实际后端已返回完整内容）
  let i = 0;
  const interval = setInterval(() => {
    if (i < message.length) {
      onChunk(message[i]);
      i++;
    } else {
      clearInterval(interval);
      onComplete?.(usage, cost);
    }
  }, 20);

  return sessionId;
}

// 获取会话消息历史
export async function getChatHistory(sessionId: string): Promise<AIMessage[]> {
  const res: any = await http.get(`/ai/session/${sessionId}/messages`);
  return (res.data?.list || []).map((m: any) => ({
    role: m.role,
    content: m.content,
    timestamp: m.created_at
  }));
}

// 获取会话列表
export async function listSessions(page = 1, pageSize = 20): Promise<{ items: any[], total: number }> {
  const res: any = await http.get('/ai/session/list', { params: { page, pageSize } });
  return res.data || { items: [], total: 0 };
}

// 删除会话
export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`/ai/session/${sessionId}`);
}

// 获取Token使用统计
export async function getUsageStats(): Promise<any> {
  const res: any = await http.get('/ai/session/list', { params: { page: 1, pageSize: 9999 } });
  const sessions = res.data?.list || [];
  return {
    totalTokens: sessions.reduce((s: number, x: any) => s + (x.total_tokens || 0), 0),
    totalCost: sessions.reduce((s: number, x: any) => s + (x.total_cost || 0), 0),
    totalSessions: sessions.length
  };
}
