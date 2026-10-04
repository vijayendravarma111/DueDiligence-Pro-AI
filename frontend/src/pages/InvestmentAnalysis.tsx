import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Space, Spin, Alert, List, Tag, Row, Col, Progress, message } from 'antd';
import {
  FundOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  LineChartOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem, InvestmentAnalysis as InvestmentAnalysisType } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const InvestmentAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('doc_id');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(docIdParam ? Number(docIdParam) : null);
  const [investmentData, setInvestmentData] = useState<InvestmentAnalysisType | null>(null);
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

  const fetchInvestmentReport = async (docId: number) => {
    setLoading(true);
    try {
      const response = await api.post(`/documents/${docId}/investment-analysis`);
      setInvestmentData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch investment report:', error);
      message.error('Failed to load investment analysis report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchInvestmentReport(selectedDocId);
    }
  }, [selectedDocId]);

  const getRecommendationTag = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'strong buy':
      case 'buy':
        return <Tag color="green" style={{ fontSize: 16, padding: '4px 16px' }}>REC: {rec.toUpperCase()}</Tag>;
      case 'hold':
        return <Tag color="gold" style={{ fontSize: 16, padding: '4px 16px' }}>REC: {rec.toUpperCase()}</Tag>;
      default:
        return <Tag color="red" style={{ fontSize: 16, padding: '4px 16px' }}>REC: {rec.toUpperCase()}</Tag>;
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
          Venture Capital & Private Equity Investment Audit
        </Title>
        <Text style={{ color: '#94A3B8' }}>
          Evaluation of enterprise valuation, scalable unit economics, competitive moat, and investment recommendation.
        </Text>
      </div>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ color: '#E2E8F0', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Select Document for Investment Analysis:
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
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: '#94A3B8' }}>Analyzing investment thesis and unit economics...</Text>
          </div>
        </div>
      ) : investmentData ? (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card style={{ background: '#1E293B', borderColor: '#334155', textAlign: 'center', height: '100%' }}>
                <Text type="secondary" style={{ color: '#94A3B8' }}>Investment Opportunity Score</Text>
                <div style={{ margin: '16px 0' }}>
                  <Progress
                    type="circle"
                    percent={investmentData.investment_score}
                    strokeColor="#10B981"
                    format={(percent) => <span style={{ color: '#F8FAFC', fontSize: 26 }}>{percent}/100</span>}
                  />
                </div>
                <div>{getRecommendationTag(investmentData.recommendation)}</div>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#3B82F6' }} />
                    <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Valuation & Financial Insights</Text>
                  </Space>
                }
                style={{ background: '#1E293B', borderColor: '#334155', height: '100%' }}
              >
                <Paragraph style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 1.6, background: '#0F172A', padding: 16, borderRadius: 6, border: '1px solid #334155' }}>
                  {investmentData.valuation_insight}
                </Paragraph>
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                  <Tag color="blue">
                    Confidence: {(investmentData.confidence_score * 100).toFixed(0)}%
                  </Tag>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#10B981' }} />
                    <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Investment Strengths</Text>
                  </Space>
                }
                style={{ background: '#1E293B', borderColor: '#334155', height: '100%' }}
              >
                <List
                  dataSource={investmentData.strengths || []}
                  renderItem={(strength) => (
                    <List.Item style={{ color: '#A7F3D0', borderBottom: '1px solid #334155' }}>
                      🟢 {strength}
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <CloseCircleOutlined style={{ color: '#EF4444' }} />
                    <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Weaknesses & Risks</Text>
                  </Space>
                }
                style={{ background: '#1E293B', borderColor: '#334155', height: '100%' }}
              >
                <List
                  dataSource={investmentData.weaknesses || []}
                  renderItem={(weakness) => (
                    <List.Item style={{ color: '#FCA5A5', borderBottom: '1px solid #334155' }}>
                      🔴 {weakness}
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {investmentData.final_analyst_opinion && (
            <Card style={{ background: '#064E3B', borderColor: '#10B981', borderRadius: 8 }}>
              <Space align="start" size="middle">
                <TrophyOutlined style={{ fontSize: 24, color: '#34D399', marginTop: 4 }} />
                <div>
                  <Title level={5} style={{ color: '#D1FAE5', margin: 0 }}>
                    Final Venture Partner Opinion
                  </Title>
                  <Paragraph style={{ color: '#ECFDF5', marginTop: 8, margin: 0, fontSize: 15 }}>
                    "{investmentData.final_analyst_opinion}"
                  </Paragraph>
                </div>
              </Space>
            </Card>
          )}
        </div>
      ) : (
        <Alert
          message="Select a Document"
          description="Select a document above to evaluate investment metrics."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default InvestmentAnalysis;
