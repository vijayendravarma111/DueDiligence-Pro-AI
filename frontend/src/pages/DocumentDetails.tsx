import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Tag, Space, Spin, Alert, List, message } from 'antd';
import {
  FileTextOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  WarningOutlined,
  FundOutlined,
  BulbOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem } from '../types';

const { Title, Text, Paragraph } = Typography;

const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchDocumentDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data);
    } catch (error: any) {
      console.error('Error fetching document details:', error);
      message.error('Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocumentDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!document) {
    return (
      <Alert
        message="Document Not Found"
        description="The requested document could not be found or you do not have permission to view it."
        type="error"
        showIcon
      />
    );
  }

  const summary = document.analysis?.summary;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: 16, background: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
      >
        Back to Dashboard
      </Button>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <Space align="center" size="middle">
            <FileTextOutlined style={{ fontSize: 32, color: '#3B82F6' }} />
            <div>
              <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
                {document.filename}
              </Title>
              <Space style={{ marginTop: 4 }}>
                <Tag color={document.file_type.toLowerCase() === 'pdf' ? 'red' : 'blue'}>
                  {document.file_type.toUpperCase()}
                </Tag>
                <Tag icon={<CheckCircleOutlined />} color="success">
                  {document.status.toUpperCase()}
                </Tag>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Uploaded: {new Date(document.created_at).toLocaleString()}
                </Text>
              </Space>
            </div>
          </Space>

          <Space size="middle" wrap>
            <Button
              type="default"
              icon={<WarningOutlined />}
              onClick={() => navigate(`/risk?doc_id=${document.id}`)}
              style={{ background: '#0F172A', borderColor: '#EF4444', color: '#FCA5A5' }}
            >
              Risk Audit
            </Button>
            <Button
              type="default"
              icon={<FundOutlined />}
              onClick={() => navigate(`/investment?doc_id=${document.id}`)}
              style={{ background: '#0F172A', borderColor: '#10B981', color: '#6EE7B7' }}
            >
              Investment Audit
            </Button>
            <Button
              type="primary"
              icon={<QuestionCircleOutlined />}
              onClick={() => navigate(`/qa?doc_id=${document.id}`)}
              style={{ background: '#3B82F6', fontWeight: 600 }}
            >
              Ask AI Assistant
            </Button>
          </Space>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <FileSearchOutlined style={{ color: '#3B82F6' }} />
            <Text style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 18 }}>
              Executive Summary & Insights
            </Text>
          </Space>
        }
        style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}
      >
        {summary ? (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ color: '#3B82F6' }}>Overview</Title>
              <Paragraph style={{ color: '#E2E8F0', fontSize: 15, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
                {summary.overview}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ color: '#10B981' }}>
                <CheckCircleOutlined /> Key Findings
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
                <WarningOutlined /> Important Risks
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
                <FundOutlined /> Financial & Business Information
              </Title>
              <Paragraph style={{ color: '#E2E8F0', fontSize: 14, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
                {summary.financial_business_info}
              </Paragraph>
            </div>

            <div>
              <Title level={5} style={{ color: '#3B82F6' }}>
                <BulbOutlined /> Actionable Recommendations
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
          </div>
        ) : (
          <Alert
            message="No Executive Summary Available"
            description="The executive summary for this document is being generated or was not found."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default DocumentDetails;
