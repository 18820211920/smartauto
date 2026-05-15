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

// 发送消息（流式）
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onComplete?: (usage: any, cost: number) => void
): Promise<string> {
  const response = await fetch('/api/v1/ai/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: JSON.stringify({
      ...request,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let sessionId = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.content !== undefined) {
            fullContent += data.content;
            onChunk(data.content);
          }
          
          if (data.done && data.usage) {
            sessionId = data.session_id || '';
            onComplete?.(data.usage, data.cost || 0);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return sessionId;
}

// 获取会话历史
export async function getChatHistory(sessionId: string): Promise<AIMessage[]> {
  const res = await http.get(`/ai/chat/history/${sessionId}`);
  return res.data?.messages || [];
}

// 获取会话列表
export async function listSessions(page = 1, pageSize = 20): Promise<{ items: any[], total: number }> {
  const res = await http.get('/ai/chat/sessions', { params: { page, page_size: pageSize } });
  return res.data || { items: [], total: 0 };
}

// 删除会话
export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`/ai/chat/history/${sessionId}`);
}

// 获取使用统计
export async function getUsageStats(month?: string): Promise<any> {
  const res = await http.get('/ai/model/stats/usage', { params: { month } });
  return res.data;
}