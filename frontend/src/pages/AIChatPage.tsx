/**
 * AI对话页面 - Phase 3 Enhanced
 * 真正的SSE流式输出、Markdown渲染、代码高亮
 */
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { listModels, sendMessageStream, type AIModel, type AIMessage } from '../api/ai';

export default function AIChatPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('mock-gpt');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [cost, setCost] = useState(0);
  const [usage, setUsage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载模型列表
  useEffect(() => {
    listModels().then(data => {
      setModels(data);
      const defaultModel = data.find(m => m.is_default) || data[0];
      if (defaultModel) setSelectedModel(defaultModel.model_code);
    }).catch(console.error);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 自动调整textarea高度
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  };

  // 发送消息（真正的SSE流式）
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: AIMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      await sendMessageStream(
        {
          session_id: sessionId || undefined,
          messages: [...messages, userMessage],
          model_code: selectedModel,
          stream: true
        },
        // onChunk: (_content, full) => {}
        (_content, full) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = full;
            }
            return updated;
          });
        },
        // onComplete: (usage, cost, sessionId) => {}
        (usageData, costData, sid) => {
          setUsage(usageData);
          setCost(costData);
          if (!sessionId) setSessionId(sid);
        },
        // onError: (error) => {}
        (error) => {
          console.error('Chat error:', error);
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = '抱歉，发生了错误: ' + error.message + '\n\n请稍后重试。';
            }
            return updated;
          });
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = '抱歉，发生了错误。请稍后重试。';
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    setSessionId('');
    setCost(0);
    setUsage(null);
  };

  return (
    <div className="ai-chat-page" style={styles.container}>
      {/* 模型选择 */}
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 AI 对话</h2>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          style={styles.select}
        >
          {models.map(model => (
            <option key={model.id} value={model.model_code}>
              {model.model_name} ({model.provider})
            </option>
          ))}
        </select>
        <button onClick={handleClear} style={styles.clearBtn}>
          🗑️ 新对话
        </button>
      </div>

      {/* 消息列表 */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>💬</div>
            <p>开始一段新的对话吧</p>
            <p style={styles.hint}>支持Markdown格式、代码高亮、知识库增强</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
            }}
          >
            <div style={{...styles.avatar, background: msg.role === 'user' ? '#6366f1' : '#10b981'}}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div style={styles.messageContent}>
              <div style={{...styles.messageText, background: msg.role === 'user' ? '#6366f1' : '#f5f5f5', color: msg.role === 'user' ? '#fff' : '#333'}}>
                {msg.role === 'user' ? (
                  <span>{msg.content}</span>
                ) : (
                  <ReactMarkdown
                    children={msg.content}
                    components={{
                      code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  />
                )}
                {msg.role === 'assistant' && isStreaming && idx === messages.length - 1 && (
                  <span style={styles.cursor}>▊</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 使用统计 */}
      {usage && (
        <div style={styles.stats}>
          <span>💰 费用: ${cost.toFixed(4)}</span>
          <span>📊 Token: {usage.total_tokens}</span>
          <span>⏱️ 输入: {usage.prompt_tokens} / 输出: {usage.completion_tokens}</span>
        </div>
      )}

      {/* 输入区域 */}
      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，支持Markdown格式 Enter发送，Shift+Enter换行..."
          style={styles.textarea}
          disabled={isStreaming}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          style={{
            ...styles.sendBtn,
            ...(input.trim() && !isStreaming ? {} : styles.sendBtnDisabled)
          }}
        >
          {isStreaming ? '⏳...' : '🚀 发送'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    cursor: 'pointer'
  },
  clearBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  messages: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 0'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  hint: {
    fontSize: '14px',
    color: '#999'
  },
  message: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  userMessage: {
    flexDirection: 'row-reverse'
  },
  assistantMessage: {
    flexDirection: 'row'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    color: '#fff'
  },
  messageContent: {
    maxWidth: '70%'
  },
  messageText: {
    padding: '12px 16px',
    borderRadius: '12px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  cursor: {
    animation: 'blink 1s infinite'
  },
  stats: {
    display: 'flex',
    gap: '24px',
    padding: '12px 16px',
    background: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#666',
    marginBottom: '16px'
  },
  inputArea: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  textarea: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    fontSize: '15px',
    lineHeight: 1.5,
    resize: 'none',
    minHeight: '48px',
    maxHeight: '150px',
    fontFamily: 'inherit'
  },
  sendBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  sendBtnDisabled: {
    background: '#ccc',
    cursor: 'not-allowed'
  }
};
