import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Space, Spin, Alert, List, Progress, Tag, Row, Col, message } from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem, RiskAnalysis as RiskAnalysisType } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const RiskAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('doc_id');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(docIdParam ? Number(docIdParam) : null);
  const [riskData, setRiskData] = useState<RiskAnalysisType | null>(null);
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

  const fetchRiskReport = async (docId: number) => {
    setLoading(true);
    try {
      const response = await api.post(`/documents/${docId}/risk-analysis`);
      setRiskData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch risk report:', error);
      message.error('Failed to load risk analysis report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchRiskReport(selectedDocId);
    }
  }, [selectedDocId]);

  const getRiskColor = (score: number) => {
    if (score < 30) return '#10B981'; // Low - Green
    if (score < 60) return '#F59E0B'; // Medium - Yellow
    if (score < 80) return '#EF4444'; // High - Red
    return '#DC2626'; // Critical - Dark Red
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
          Chief Risk Officer (CRO) Risk Audit
        </Title>
        <Text style={{ color: '#94A3B8' }}>
          Automated risk assessment analyzing financial, legal, operational, market, and governance exposure.
        </Text>
      </div>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ color: '#E2E8F0', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Select Document for Risk Assessment:
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
            <Text style={{ color: '#94A3B8' }}>Evaluating risk vectors from document text...</Text>
          </div>
        </div>
      ) : riskData ? (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card style={{ background: '#1E293B', borderColor: '#334155', textAlign: 'center', height: '100%' }}>
                <Text type="secondary" style={{ color: '#94A3B8' }}>Overall Risk Score</Text>
                <div style={{ margin: '16px 0' }}>
                  <Progress
                    type="dashboard"
                    percent={riskData.overall_risk_score}
                    strokeColor={getRiskColor(riskData.overall_risk_score)}
                    format={(percent) => <span style={{ color: '#F8FAFC', fontSize: 24 }}>{percent}%</span>}
                  />
                </div>
                <div>
                  <Tag color={riskData.overall_risk_score > 60 ? 'red' : 'gold'} style={{ fontSize: 14, padding: '4px 12px' }}>
                    Risk Level: {riskData.risk_level}
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card
                title={<Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Risk Exposure Breakdown</Text>}
                style={{ background: '#1E293B', borderColor: '#334155', height: '100%' }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#E2E8F0' }}>Legal & Indemnification Risk</Text>
                    <Text style={{ color: '#94A3B8' }}>{riskData.risk_breakdown?.legal_risk || 50}%</Text>
                  </div>
                  <Progress percent={riskData.risk_breakdown?.legal_risk || 50} strokeColor="#EF4444" showInfo={false} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#E2E8F0' }}>Financial & Debt Covenant Risk</Text>
                    <Text style={{ color: '#94A3B8' }}>{riskData.risk_breakdown?.financial_risk || 40}%</Text>
                  </div>
                  <Progress percent={riskData.risk_breakdown?.financial_risk || 40} strokeColor="#F59E0B" showInfo={false} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#E2E8F0' }}>Operational & Customer Concentration Risk</Text>
                    <Text style={{ color: '#94A3B8' }}>{riskData.risk_breakdown?.operational_risk || 45}%</Text>
                  </div>
                  <Progress percent={riskData.risk_breakdown?.operational_risk || 45} strokeColor="#3B82F6" showInfo={false} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#E2E8F0' }}>Market & Sector Competition Risk</Text>
                    <Text style={{ color: '#94A3B8' }}>{riskData.risk_breakdown?.market_risk || 35}%</Text>
                  </div>
                  <Progress percent={riskData.risk_breakdown?.market_risk || 35} strokeColor="#10B981" showInfo={false} />
                </div>
              </Card>
            </Col>
          </Row>

          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#EF4444' }} />
                <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Identified Risk Factors</Text>
              </Space>
            }
            style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}
          >
            <List
              dataSource={riskData.key_risks || []}
              renderItem={(risk) => (
                <List.Item style={{ color: '#FCA5A5', borderBottom: '1px solid #334155' }}>
                  ⚠️ {risk}
                </List.Item>
              )}
            />
          </Card>

          <Card
            title={
              <Space>
                <MedicineBoxOutlined style={{ color: '#10B981' }} />
                <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>Mitigation Strategies</Text>
              </Space>
            }
            style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8, marginBottom: 24 }}
          >
            <List
              dataSource={riskData.recommendations || []}
              renderItem={(rec) => (
                <List.Item style={{ color: '#A7F3D0', borderBottom: '1px solid #334155' }}>
                  🛡️ {rec}
                </List.Item>
              )}
            />
          </Card>

          {riskData.final_consultant_opinion && (
            <Card style={{ background: '#1E1B4B', borderColor: '#6366F1', borderRadius: 8 }}>
              <Space align="start" size="middle">
                <AuditOutlined style={{ fontSize: 24, color: '#818CF8', marginTop: 4 }} />
                <div>
                  <Title level={5} style={{ color: '#C7D2FE', margin: 0 }}>
                    Final Chief Risk Officer Opinion
                  </Title>
                  <Paragraph style={{ color: '#E0E7FF', marginTop: 8, margin: 0, fontSize: 15 }}>
                    "{riskData.final_consultant_opinion}"
                  </Paragraph>
                </div>
              </Space>
            </Card>
          )}
        </div>
      ) : (
        <Alert
          message="Select a Document"
          description="Select a document above to evaluate risk metrics."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default RiskAnalysis;
