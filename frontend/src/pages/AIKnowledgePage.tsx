/**
 * AI知识库管理页面 - Phase 2
 * 知识库创建、文档上传、向量切片
 */
import { useState, useEffect } from 'react';
import { http } from '../api/http';


interface KnowledgeBase {
  id: number;
  kb_name: string;
  kb_code: string;
  description: string;
  category: string;
  doc_count: number;
  chunk_count: number;
  status: number;
}

interface Document {
  id: number;
  kb_id: number;
  doc_name: string;
  doc_type: string;
  file_size: number;
  chunk_count: number;
  status: number;
  created_at: string;
}

export default function AIKnowledgePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedKB, setSelectedKB] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'base' | 'document'>('base');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 新建知识库表单
  const [newKB, setNewKB] = useState({
    kb_name: '',
    kb_code: '',
    description: '',
    category: ''
  });

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    try {
      const res = await http.get('/ai/knowledge/base/list');
      const bases = res.data?.items || [];
      setKnowledgeBases(bases);
      if (bases.length > 0 && !selectedKB) {
        setSelectedKB(bases[0].id);
      }
    } catch (error) {
      console.error('Load KB failed:', error);
    }
  };

  // 加载文档列表
  const loadDocuments = async (kbId: number) => {
    try {
      const res = await http.get('/ai/knowledge/document/list', { params: { kb_id: kbId } });
      setDocuments(res.data?.items || []);
    } catch (error) {
      console.error('Load docs failed:', error);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKB) {
      loadDocuments(selectedKB);
    }
  }, [selectedKB]);

  // 创建知识库
  const handleCreateKB = async () => {
    if (!newKB.kb_name || !newKB.kb_code) return;
    
    try {
      await http.post('/ai/knowledge/base/create', newKB);
      setShowCreateModal(false);
      setNewKB({ kb_name: '', kb_code: '', description: '', category: '' });
      loadKnowledgeBases();
    } catch (error) {
      console.error('Create KB failed:', error);
    }
  };

  // 上传文档
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKB) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('kb_id', String(selectedKB));
    formData.append('file', files[0]);

    try {
      await http.post('/ai/knowledge/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadDocuments(selectedKB);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  // 删除知识库
  const handleDeleteKB = async (kbId: number) => {
    if (!confirm('确定删除该知识库？')) return;
    try {
      await http.delete(`/ai/knowledge/base/${kbId}`);
      loadKnowledgeBases();
    } catch (error) {
      console.error('Delete KB failed:', error);
    }
  };

  // 删除文档
  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('确定删除该文档？')) return;
    try {
      await http.delete(`/ai/knowledge/document/${docId}`);
      if (selectedKB) loadDocuments(selectedKB);
    } catch (error) {
      console.error('Delete doc failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="ai-knowledge-page" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>AI 知识库</h2>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          + 新建知识库
        </button>
      </div>

      <div style={styles.content}>
        {/* 左侧：知识库列表 */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>知识库 ({knowledgeBases.length})</h3>
          <div style={styles.kbList}>
            {knowledgeBases.map(kb => (
              <div
                key={kb.id}
                onClick={() => setSelectedKB(kb.id)}
                style={{
                  ...styles.kbItem,
                  ...(selectedKB === kb.id ? styles.kbItemActive : {})
                }}
              >
                <div style={styles.kbName}>{kb.kb_name}</div>
                <div style={styles.kbInfo}>
                  📄 {kb.doc_count} | 🔢 {kb.chunk_count}
                </div>
              </div>
            ))}
            {knowledgeBases.length === 0 && (
              <div style={styles.empty}>暂无知识库</div>
            )}
          </div>
        </div>

        {/* 右侧：文档列表 */}
        <div style={styles.main}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('base')}
              style={{ ...styles.tab, ...(activeTab === 'base' ? styles.tabActive : {}) }}
            >
              知识库详情
            </button>
            <button
              onClick={() => setActiveTab('document')}
              style={{ ...styles.tab, ...(activeTab === 'document' ? styles.tabActive : {}) }}
            >
              文档管理 ({documents.length})
            </button>
          </div>

          {activeTab === 'base' && selectedKB && (
            <div style={styles.detail}>
              {knowledgeBases.filter(kb => kb.id === selectedKB).map(kb => (
                <div key={kb.id}>
                  <h3>{kb.kb_name}</h3>
                  <p style={styles.desc}>{kb.description || '暂无描述'}</p>
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{kb.doc_count}</div>
                      <div style={styles.statLabel}>文档数</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{kb.chunk_count}</div>
                      <div style={styles.statLabel}>切片数</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{kb.category || '-'}</div>
                      <div style={styles.statLabel}>分类</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKB(kb.id)}
                    style={styles.deleteBtn}
                  >
                    删除知识库
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'document' && (
            <div style={styles.docList}>
              <div style={styles.uploadArea}>
                <label style={styles.uploadBtn}>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                  {isUploading ? '上传中...' : '+ 上传文档'}
                </label>
                <span style={styles.hint}>支持 PDF/TXT/MD/DOC 格式，单文件≤50MB</span>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>文件名</th>
                    <th style={styles.th}>类型</th>
                    <th style={styles.th}>大小</th>
                    <th style={styles.th}>切片</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} style={styles.tr}>
                      <td style={styles.td}>{doc.doc_name}</td>
                      <td style={styles.td}>{doc.doc_type.toUpperCase()}</td>
                      <td style={styles.td}>{formatFileSize(doc.file_size)}</td>
                      <td style={styles.td}>{doc.chunk_count}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          background: doc.status === 2 ? '#d4edda' : '#fff3cd',
                          color: doc.status === 2 ? '#155724' : '#856404'
                        }}>
                          {doc.status === 2 ? '✓ 已处理' : '⏳ 处理中'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          style={styles.iconBtn}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                        暂无文档，请上传
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新建知识库弹窗 */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>新建知识库</h3>
            <div style={styles.formGroup}>
              <label>知识库名称 *</label>
              <input
                value={newKB.kb_name}
                onChange={e => setNewKB({ ...newKB, kb_name: e.target.value })}
                placeholder="例如：产品手册"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>知识库编码 *</label>
              <input
                value={newKB.kb_code}
                onChange={e => setNewKB({ ...newKB, kb_code: e.target.value })}
                placeholder="例如：product_manual"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>分类</label>
              <input
                value={newKB.category}
                onChange={e => setNewKB({ ...newKB, category: e.target.value })}
                placeholder="例如：技术文档"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>描述</label>
              <textarea
                value={newKB.description}
                onChange={e => setNewKB({ ...newKB, description: e.target.value })}
                placeholder="描述知识库的用途..."
                style={styles.textarea}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                取消
              </button>
              <button
                onClick={handleCreateKB}
                disabled={!newKB.kb_name || !newKB.kb_code}
                style={styles.submitBtn}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600
  },
  createBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  content: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    overflow: 'hidden'
  },
  sidebar: {
    width: '240px',
    borderRight: '1px solid #eee',
    paddingRight: '20px'
  },
  sidebarTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#666'
  },
  kbList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  kbItem: {
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s'
  },
  kbItemActive: {
    background: '#f0f0ff',
    border: '1px solid #6366f1'
  },
  kbName: {
    fontWeight: 500,
    marginBottom: '4px'
  },
  kbInfo: {
    fontSize: '12px',
    color: '#999'
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tabActive: {
    background: '#6366f1',
    color: '#fff',
    border: '1px solid #6366f1'
  },
  detail: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '12px'
  },
  desc: {
    color: '#666',
    margin: '12px 0'
  },
  statsGrid: {
    display: 'flex',
    gap: '24px',
    margin: '20px 0'
  },
  statItem: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#6366f1'
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  deleteBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #dc3545',
    background: '#fff',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '13px'
  },
  docList: {
    flex: 1,
    overflow: 'auto'
  },
  uploadArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  uploadBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px dashed #6366f1',
    background: '#fafafa',
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  hint: {
    fontSize: '12px',
    color: '#999'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #eee',
    fontWeight: 500,
    fontSize: '13px',
    color: '#666'
  },
  tr: {
    borderBottom: '1px solid #f5f5f5'
  },
  td: {
    padding: '12px',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '16px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90%'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  }
};