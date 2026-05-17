/**
 * AI知识库管理页面 - Phase 3
 * 知识库创建、文档上传、向量切片、RAG检索
 */
import { useState, useEffect, useRef } from 'react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kb_id', String(selectedKB));

      try {
        const res = await http.post('/ai/knowledge/document/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e: any) => {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        });
        
        // 向量化文档
        if (res.data?.id) {
          await http.post('/ai/knowledge/document/embed', {
            doc_id: res.data.id,
            kb_id: selectedKB
          });
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(100);
    loadDocuments(selectedKB);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 搜索知识库
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await http.post('/ai/knowledge/search', {
        query: searchQuery,
        kb_id: selectedKB,
        top_k: 10
      });
      setSearchResults(res.data?.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // 删除文档
  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      await http.delete(`/ai/knowledge/document/${docId}`);
      if (selectedKB) {
        loadDocuments(selectedKB);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // 获取文件类型图标
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('docx')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('txt')) return '📃';
    return '📁';
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="ai-knowledge-page" style={styles.container}>
      {/* 顶部标题 */}
      <div style={styles.header}>
        <h2 style={styles.title}>🧠 AI 知识库</h2>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          ➕ 创建知识库
        </button>
      </div>

      {/* 知识库选择 */}
      <div style={styles.kbSelector}>
        <label style={styles.label}>选择知识库：</label>
        <select
          value={selectedKB || ''}
          onChange={e => setSelectedKB(Number(e.target.value))}
          style={styles.select}
        >
          {knowledgeBases.map(kb => (
            <option key={kb.id} value={kb.id}>
              {kb.kb_name} ({kb.doc_count}文档 | {kb.chunk_count}切片)
            </option>
          ))}
        </select>
      </div>

      {/* Tab切换 */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'base' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('base')}
        >
          📚 文档管理
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'document' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('document')}
        >
          🔍 知识检索
        </button>
      </div>

      {/* 文档管理 */}
      {activeTab === 'base' && (
        <div style={styles.content}>
          {/* 上传区域 */}
          <div style={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedKB || isUploading}
              style={styles.uploadBtn}
            >
              {isUploading ? '⏳ 上传中...' : '📤 上传文档'}
            </button>
            {isUploading && (
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: uploadProgress + '%'}} />
                <span>{uploadProgress}%</span>
              </div>
            )}
            <span style={styles.hint}>支持 PDF/Word/Excel/TXT 格式</span>
          </div>

          {/* 文档列表 */}
          <div style={styles.docList}>
            <h3 style={styles.subTitle}>📄 文档列表</h3>
            {documents.length === 0 ? (
              <div style={styles.empty}>暂无文档，请上传</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>类型</th>
                    <th>大小</th>
                    <th>切片数</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td>{getFileIcon(doc.doc_type)} {doc.doc_name}</td>
                      <td>{doc.doc_type}</td>
                      <td>{formatSize(doc.file_size)}</td>
                      <td>{doc.chunk_count}</td>
                      <td>
                        <span style={{
                          ...styles.status,
                          background: doc.status === 1 ? '#10b981' : '#999'
                        }}>
                          {doc.status === 1 ? '已索引' : '待处理'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteDoc(doc.id)} style={styles.deleteBtn}>
                          🗑️ 删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 知识检索 */}
      {activeTab === 'document' && (
        <div style={styles.content}>
          <div style={styles.searchBox}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="输入关键词进行RAG检索..."
              style={styles.searchInput}
            />
            <button onClick={handleSearch} style={styles.searchBtn}>
              🔍 搜索
            </button>
          </div>

          <div style={styles.results}>
            <h3 style={styles.subTitle}>📋 检索结果</h3>
            {searchResults.length === 0 ? (
              <div style={styles.empty}>输入关键词开始检索</div>
            ) : (
              searchResults.map((result, idx) => (
                <div key={idx} style={styles.resultItem}>
                  <div style={styles.resultScore}>相关性: {(result.score * 100).toFixed(1)}%</div>
                  <div style={styles.resultContent}>{result.content}</div>
                  <div style={styles.resultSource}>来源: {result.source}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 创建知识库弹窗 */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>创建知识库</h3>
            <div style={styles.formGroup}>
              <label>知识库名称：</label>
              <input
                type="text"
                value={newKB.kb_name}
                onChange={e => setNewKB({...newKB, kb_name: e.target.value})}
                placeholder="例如：产品知识库"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>知识库编码：</label>
              <input
                type="text"
                value={newKB.kb_code}
                onChange={e => setNewKB({...newKB, kb_code: e.target.value})}
                placeholder="例如：product_kb"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>分类：</label>
              <input
                type="text"
                value={newKB.category}
                onChange={e => setNewKB({...newKB, category: e.target.value})}
                placeholder="例如：产品/技术/销售"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>描述：</label>
              <textarea
                value={newKB.description}
                onChange={e => setNewKB({...newKB, description: e.target.value})}
                placeholder="描述知识库的用途..."
                style={styles.textarea}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={handleCreateKB} style={styles.confirmBtn}>创建</button>
              <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '24px' },
  createBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  kbSelector: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  label: { fontWeight: 500 },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '300px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { padding: '10px 20px', border: '1px solid #ddd', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  tabActive: { background: '#6366f1', color: '#fff', border: '1px solid #6366f1' },
  content: { background: '#fff', padding: '20px', borderRadius: '12px', minHeight: '400px' },
  uploadArea: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '20px', border: '2px dashed #ddd', borderRadius: '8px' },
  uploadBtn: { padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  progressBar: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
  progressFill: { height: '8px', background: '#6366f1', borderRadius: '4px', transition: 'width 0.3s' },
  hint: { color: '#999', fontSize: '13px' },
  docList: { marginTop: '20px' },
  subTitle: { margin: '0 0 16px 0', fontSize: '16px' },
  empty: { textAlign: 'center', padding: '40px', color: '#999' },
  table: { width: '100%', borderCollapse: 'collapse' },
  status: { padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '12px' },
  deleteBtn: { padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  searchBox: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' },
  searchBtn: { padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  results: {},
  resultItem: { padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '12px' },
  resultScore: { fontSize: '12px', color: '#6366f1', marginBottom: '8px' },
  resultContent: { lineHeight: 1.6, marginBottom: '8px' },
  resultSource: { fontSize: '12px', color: '#999' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', padding: '24px', borderRadius: '12px', width: '400px' },
  modalTitle: { margin: '0 0 20px 0' },
  formGroup: { marginBottom: '16px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' },
  confirmBtn: { padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { padding: '8px 20px', background: '#999', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};
