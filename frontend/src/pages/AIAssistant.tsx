import React, { useEffect, useState, useRef } from 'react';
import { Card, Select, Input, Button, Typography, Space, Divider, Avatar, Collapse, Tag, Progress, Spin, message } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  InfoCircleOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  SolutionOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';
import axios from 'axios';

// Helper to resolve static asset absolute URLs on the backend
const getMediaURL = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const baseURL = import.meta.env.VITE_API_URL || '';
  const cleanBase = baseURL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${cleanBase}${path}`;
};

// Helper to download cross-origin reports directly without opening new tabs/windows
const downloadReport = async (path: string, fileName: string) => {
  const fullUrl = getMediaURL(path);
  if (!fullUrl) return;
  try {
    message.loading({ content: 'Downloading report file...', key: 'download_report', duration: 0 });
    const res = await axios.get(fullUrl, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success({ content: 'Download completed successfully.', key: 'download_report', duration: 2 });
  } catch (err) {
    console.error(err);
    message.error({ content: 'Download failed. Opening file in a new tab instead.', key: 'download_report', duration: 3 });
    window.open(fullUrl, '_blank');
  }
};

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  evidence?: string;
  confidence?: number;
  source?: string;
  pdfPath?: string;
  docxPath?: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { company, selectedDocId, setSelectedDocId } = UseApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = async () => {
    if (!company) return;
    setLoadingDocs(true);
    try {
      const res = await api.get('/documents/', { params: { company_id: company.id } });
      const completedDocs = res.data.filter((d: any) => d.status === 'completed');
      setDocuments(completedDocs);
      
      // Auto-heal state: if selected doc ID is not found, default to first completed or null
      if (selectedDocId && !completedDocs.some((d: any) => d.id === selectedDocId)) {
        if (completedDocs.length > 0) {
          setSelectedDocId(completedDocs[0].id);
        } else {
          setSelectedDocId(null);
        }
      }
    } catch (e) {
      console.error(e);
      message.error('Error fetching document list.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchChatHistory = async (docId: number) => {
    try {
      const res = await api.get(`/chat/${docId}`);
      
      // Also fetch related reports of type 'chat' to obtain PDF/DOCX download paths!
      const reportRes = await api.get('/reports/', { params: { document_id: docId, report_type: 'chat' } });
      
      const formatted: ChatMessage[] = [];
      res.data.forEach((history: any, idx: number) => {
        // Find matching report to retrieve download paths
        // We match by comparing the answer snippets or matching index
        const matchingReport = reportRes.data.find((r: any) => {
          try {
            // Title contains the question snippet
            return r.title.includes(history.question.slice(0, 15));
          } catch { return false; }
        });

        formatted.push({
          id: `usr_${history.id}`,
          sender: 'user',
          text: history.question,
          timestamp: new Date(history.created_at)
        });
        
        formatted.push({
          id: `bot_${history.id}`,
          sender: 'bot',
          text: history.answer,
          evidence: history.supporting_evidence,
          confidence: history.confidence_score,
          source: history.doc_source,
          pdfPath: matchingReport?.pdf_path || undefined,
          docxPath: matchingReport?.docx_path || undefined,
          timestamp: new Date(history.created_at)
        });
      });
      
      setMessages(formatted);
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  };

  useEffect(() => {
    if (company) {
      fetchDocuments();
    }
  }, [company]);

  useEffect(() => {
    if (selectedDocId) {
      fetchChatHistory(selectedDocId);
    } else {
      setMessages([]);
    }
  }, [selectedDocId]);

  // Scroll chat window to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedDocId) return;
    
    const userMsg: ChatMessage = {
      id: `usr_temp_${Date.now()}`,
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSubmitting(true);

    try {
      const res = await api.post(`/chat/${selectedDocId}`, { question: userMsg.text });
      
      // Delay slightly and fetch reports list to gather the newly generated download path!
      setTimeout(async () => {
        let pdf = '';
        let docx = '';
        try {
          const reportRes = await api.get('/reports/', { params: { document_id: selectedDocId, report_type: 'chat' } });
          if (reportRes.data.length > 0) {
            pdf = reportRes.data[0].pdf_path;
            docx = reportRes.data[0].docx_path;
          }
        } catch {}

        const botMsg: ChatMessage = {
          id: `bot_temp_${Date.now()}`,
          sender: 'bot',
          text: res.data.answer,
          evidence: res.data.supporting_evidence,
          confidence: res.data.confidence_score,
          source: res.data.doc_source,
          pdfPath: pdf || undefined,
          docxPath: docx || undefined,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }, 1000);
      
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to query vector database.');
      // Remove temporary user message if failed? No, keep it and append error
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'bot',
        text: 'Error connecting to vector semantic analysis index. Please verify backend state.',
        timestamp: new Date()
      }]);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>Document Intelligence</Title>
          <Paragraph style={{ color: '#94A3B8', marginTop: 4, margin: 0 }}>
            Query your indexed contract pages. The search window is strictly isolated to prevent document cross-contamination.
          </Paragraph>
        </div>

        {/* Document Selector */}
        <Space size="middle">
          <Text style={{ color: '#94A3B8' }}>Select Target Context:</Text>
          <Select
            value={selectedDocId}
            onChange={(value) => setSelectedDocId(value)}
            style={{ width: 300 }}
            placeholder="No Documents Loaded"
            loading={loadingDocs}
            options={documents.map(d => ({ value: d.id, label: d.file_name }))}
          />
        </Space>
      </div>

      <Divider style={{ margin: '8px 0 16px 0', borderColor: '#334155' }} />

      {!selectedDocId ? (
        <Card className="glass-panel" style={{ textAlign: 'center', padding: 40, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <InfoCircleOutlined style={{ fontSize: 48, color: '#3B82F6', marginBottom: 16 }} />
            <Title level={4}>No Target Document Context Selected</Title>
            <Paragraph style={{ color: '#94A3B8' }}>
              Please select a completed document from the dropdown above to engage the AI Assistant.
            </Paragraph>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} className="glass-panel">
          {/* Header Info */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #334155', backgroundColor: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <SolutionOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
              <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Active Terminal: {selectedDoc?.file_name}</Text>
            </Space>
            <Tag color="blue">RAG Isolation Enforced</Tag>
          </div>

          {/* Chat Pane */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748B' }}>
                <MessageOutlined style={{ fontSize: 36, marginBottom: 16 }} />
                <Paragraph>No queries initiated. Ask a question regarding risk parameters, compliance dates, or valuation schedules.</Paragraph>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    gap: 12,
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: msg.sender === 'user' ? '#3B82F6' : '#1E293B',
                      border: msg.sender === 'bot' ? '1px solid #334155' : 'none'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        backgroundColor: msg.sender === 'user' ? '#3B82F6' : '#111827',
                        border: msg.sender === 'bot' ? '1px solid #334155' : 'none',
                        color: '#F8FAFC',
                        fontSize: 14,
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Bot citation, confidence and export info */}
                    {msg.sender === 'bot' && msg.evidence && (
                      <div style={{ marginTop: 4, width: '100%' }}>
                        <Collapse ghost size="small" expandIconPosition="end">
                          <Panel
                            header={
                              <Space size="middle" style={{ fontSize: 12 }}>
                                <Text style={{ color: '#3B82F6', fontWeight: 500 }}>Supporting Evidence</Text>
                                <span style={{ color: '#64748B' }}>|</span>
                                <Text style={{ color: '#10B981' }}>Conf: {Math.round((msg.confidence || 0) * 100)}%</Text>
                              </Space>
                            }
                            key="1"
                            style={{ border: '1px solid #334155', borderRadius: 8, padding: 0 }}
                          >
                            <div style={{ padding: '8px 12px', background: '#0F172A', borderRadius: 6, fontSize: 13, color: '#94A3B8', borderLeft: '3px solid #3B82F6' }}>
                              "{msg.evidence}"
                              {msg.source && (
                                <Text style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                                  Source File: {msg.source}
                                </Text>
                              )}
                            </div>
                            
                            {/* Downloadable brief options */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                              {msg.pdfPath && (
                                <Button type="text" size="small" icon={<FilePdfOutlined />} onClick={() => downloadReport(msg.pdfPath!, `AI_Brief_${selectedDoc?.file_name.replace(/\.[^/.]+$/, "")}.pdf`)} style={{ color: '#94A3B8', fontSize: 12 }}>
                                  PDF
                                </Button>
                              )}
                              {msg.docxPath && (
                                <Button type="text" size="small" icon={<FileWordOutlined />} onClick={() => downloadReport(msg.docxPath!, `AI_Brief_${selectedDoc?.file_name.replace(/\.[^/.]+$/, "")}.docx`)} style={{ color: '#94A3B8', fontSize: 12 }}>
                                  DOCX
                                </Button>
                              )}
                            </div>
                          </Panel>
                        </Collapse>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {submitting && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 12 }}>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                <Card size="small" style={{ backgroundColor: '#111827', borderColor: '#334155', color: '#94A3B8' }}>
                  <Spin size="small" style={{ marginRight: 8 }} /> Vector similarity lookup active...
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #334155', backgroundColor: '#111827' }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about the contract clauses, capital covenants, or liability provisions..."
                  disabled={submitting}
                  size="large"
                  onPressEnter={handleSendMessage}
                  style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="large"
                  onClick={handleSendMessage}
                  loading={submitting}
                  style={{ height: 40 }}
                />
              </Space.Compact>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
