import React, { useEffect, useState } from 'react';
import { Card, Select, Input, Button, Typography, Space, Tag, Spin, Alert, List, Divider, message } from 'antd';
import {
  SendOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem, ChatResponse, ChatMessage } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AIQuestionAnswer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('doc_id');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(initialDocId ? Number(initialDocId) : null);
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [currentResponse, setCurrentResponse] = useState<ChatResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
      if (response.data.length > 0 && !selectedDocId) {
        setSelectedDocId(response.data[0].id);
      }
    } catch (error: any) {
      message.error('Failed to load documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchChatHistory = async (docId: number) => {
    try {
      const response = await api.get(`/documents/${docId}/chat-history`);
      setChatHistory(response.data);
    } catch (error: any) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchChatHistory(selectedDocId);
    }
  }, [selectedDocId]);

  const handleAsk = async () => {
    if (!selectedDocId) {
      message.error('Please select a document first.');
      return;
    }

    if (!question.trim()) {
      message.error('Please enter a question.');
      return;
    }

    setLoading(true);
    setCurrentResponse(null);

    try {
      const response = await api.post(`/documents/${selectedDocId}/ask`, {
        question: question.trim(),
      });

      setCurrentResponse(response.data);
      setQuestion('');
      fetchChatHistory(selectedDocId);
    } catch (error: any) {
      console.error('Q&A Error:', error);
      const errMsg = error.response?.data?.detail || 'Failed to generate answer.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
          Retrieval-Augmented Generation (RAG) Q&A
        </Title>
        <Text style={{ color: '#94A3B8' }}>
          Ask questions about your uploaded due diligence document. Answers are strictly synthesized from document vectors.
        </Text>
      </div>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text style={{ color: '#E2E8F0', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Select Document for Context Isolation:
            </Text>
            <Select
              placeholder="Select a document"
              value={selectedDocId}
              onChange={(value) => {
                setSelectedDocId(value);
                setCurrentResponse(null);
              }}
              style={{ width: '100%' }}
              loading={docsLoading}
              size="large"
            >
              {documents.map((doc) => (
                <Option key={doc.id} value={doc.id}>
                  📄 {doc.filename} ({doc.file_type.toUpperCase()})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text style={{ color: '#E2E8F0', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Your Question:
            </Text>
            <TextArea
              rows={3}
              placeholder="e.g. What are the key financial liabilities or termination clauses in this document?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading || !selectedDocId}
              style={{ background: '#0F172A', borderColor: '#334155', color: '#F8FAFC', fontSize: 15 }}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              loading={loading}
              onClick={handleAsk}
              disabled={!selectedDocId || !question.trim()}
              style={{ background: '#3B82F6', fontWeight: 600, paddingLeft: 28, paddingRight: 28 }}
            >
              Ask Gemini RAG
            </Button>
          </div>
        </Space>
      </Card>

      {loading && (
        <Card style={{ background: '#1E293B', borderColor: '#334155', textAlign: 'center', padding: '32px 0', marginBottom: 24 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: '#94A3B8' }}>Searching ChromaDB vectors & generating response from Gemini...</Text>
          </div>
        </Card>
      )}

      {currentResponse && (
        <Card
          title={
            <Space>
              <RobotOutlined style={{ color: '#3B82F6', fontSize: 20 }} />
              <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>AI Answer</Text>
              <Tag color="blue">Source: {currentResponse.doc_source}</Tag>
            </Space>
          }
          style={{ background: '#1E293B', borderColor: '#3B82F6', borderRadius: 8, marginBottom: 24 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ color: '#94A3B8', fontSize: 13 }}>Question:</Text>
            <Title level={5} style={{ color: '#F8FAFC', marginTop: 4 }}>
              {currentResponse.question}
            </Title>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ color: '#94A3B8', fontSize: 13 }}>Answer:</Text>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 1.6, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
              {currentResponse.answer}
            </Paragraph>
          </div>

          {currentResponse.supporting_evidence && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ color: '#94A3B8', fontSize: 13 }}>Supporting Evidence Quote:</Text>
              <div style={{ background: '#1E1B4B', padding: 12, borderRadius: 6, borderLeft: '4px solid #6366F1', marginTop: 4 }}>
                <Text italic style={{ color: '#C7D2FE', fontSize: 14 }}>
                  "{currentResponse.supporting_evidence}"
                </Text>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Tag color="green">
              Confidence Score: {(currentResponse.confidence_score * 100).toFixed(0)}%
            </Tag>
          </div>
        </Card>
      )}

      {chatHistory.length > 0 && (
        <Card
          title={
            <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>
              Question & Answer History for Selected Document
            </Text>
          }
          style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}
        >
          <List
            itemLayout="vertical"
            dataSource={chatHistory}
            renderItem={(item) => (
              <List.Item style={{ borderBottom: '1px solid #334155', padding: '16px 0' }}>
                <div style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#3B82F6', fontWeight: 600 }}>Q: {item.question}</Text>
                </div>
                <div style={{ color: '#E2E8F0', marginBottom: 8, background: '#0F172A', padding: 12, borderRadius: 6 }}>
                  {item.answer}
                </div>
                {item.supporting_evidence && (
                  <Text italic style={{ color: '#94A3B8', fontSize: 13 }}>
                    Evidence: "{item.supporting_evidence}"
                  </Text>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default AIQuestionAnswer;
