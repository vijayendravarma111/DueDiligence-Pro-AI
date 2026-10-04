import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Space, Spin, Alert, List, message } from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FundOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ExecutiveSummary: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('doc_id');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(docIdParam ? Number(docIdParam) : null);
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);

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

  const fetchSummary = async (docId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/${docId}`);
      setDocument(response.data);
    } catch (error: any) {
      message.error('Failed to load document summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchSummary(selectedDocId);
    }
  }, [selectedDocId]);

  const summary = document?.analysis?.summary;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
          Executive Document Summary
        </Title>
        <Text style={{ color: '#94A3B8' }}>
          Automated due diligence summary detailing overview, key findings, risks, financial data, and recommendations.
        </Text>
      </div>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ color: '#E2E8F0', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Select Document:
        </Text>
        <Select
          placeholder="Select a document"
          value={selectedDocId}
          onChange={(value) => setSelectedDocId(value)}
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
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : summary ? (
        <Card
          title={
            <Space>
              <FileSearchOutlined style={{ color: '#3B82F6' }} />
              <Text style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 18 }}>
                Summary for {document?.filename}
              </Text>
            </Space>
          }
          style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}
        >
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#3B82F6' }}>1. Overview</Title>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 15, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
              {summary.overview || 'Not found in the document.'}
            </Paragraph>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#10B981' }}>
              <CheckCircleOutlined /> 2. Key Findings
            </Title>
            <List
              dataSource={summary.key_findings || []}
              renderItem={(item) => (
                <List.Item style={{ color: '#E2E8F0', borderBottom: '1px solid #334155', padding: '8px 0' }}>
                  • {item}
                </List.Item>
              )}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#EF4444' }}>
              <WarningOutlined /> 3. Important Risks
            </Title>
            <List
              dataSource={summary.important_risks || []}
              renderItem={(item) => (
                <List.Item style={{ color: '#FCA5A5', borderBottom: '1px solid #334155', padding: '8px 0' }}>
                  ⚠️ {item}
                </List.Item>
              )}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#F59E0B' }}>
              <FundOutlined /> 4. Financial & Business Information
            </Title>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 14, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
              {summary.financial_business_info || 'Not found in the document.'}
            </Paragraph>
          </div>

          <div>
            <Title level={5} style={{ color: '#3B82F6' }}>
              <BulbOutlined /> 5. Recommendations
            </Title>
            <List
              dataSource={summary.recommendations || []}
              renderItem={(item) => (
                <List.Item style={{ color: '#93C5FD', borderBottom: '1px solid #334155', padding: '8px 0' }}>
                  💡 {item}
                </List.Item>
              )}
            />
          </div>
        </Card>
      ) : (
        <Alert
          message="Select a Document"
          description="Choose a document above to view its executive summary."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default ExecutiveSummary;
