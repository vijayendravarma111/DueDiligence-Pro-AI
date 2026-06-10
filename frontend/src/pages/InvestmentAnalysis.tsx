import React, { useEffect, useState } from 'react';
import { Card, Select, Button, Typography, Row, Col, Progress, Space, Divider, Tag, Spin, message } from 'antd';
import {
  LineChartOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Title, Paragraph, Text } = Typography;

const InvestmentAnalysis: React.FC = () => {
  const { company, selectedDocId, setSelectedDocId } = UseApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [reportFiles, setReportFiles] = useState<any>(null);

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

  const fetchExistingReport = async (docId: number) => {
    try {
      const res = await api.get('/reports/', { params: { document_id: docId, report_type: 'investment' } });
      if (res.data.length > 0) {
        const detailRes = await api.get(`/reports/${res.data[0].id}`);
        setReport(JSON.parse(detailRes.data.content));
        setReportFiles(detailRes.data);
      } else {
        setReport(null);
        setReportFiles(null);
      }
    } catch (e) {
      console.error('Failed to fetch existing reports', e);
    }
  };

  useEffect(() => {
    if (company) {
      fetchDocuments();
    }
  }, [company]);

  useEffect(() => {
    if (selectedDocId) {
      fetchExistingReport(selectedDocId);
    } else {
      setReport(null);
      setReportFiles(null);
    }
  }, [selectedDocId]);

  const handleRunAnalysis = async () => {
    if (!selectedDocId) return;
    setRunningAnalysis(true);
    try {
      message.loading({ content: 'Initiating VC/PE investment analysis...', key: 'inv_load' });
      const res = await api.post(`/analysis/investment/${selectedDocId}`);
      setReport(res.data);
      message.success({ content: 'Investment analysis generated successfully.', key: 'inv_load' });
      await fetchExistingReport(selectedDocId);
    } catch (err: any) {
      console.error(err);
      message.error({ content: err.response?.data?.detail || 'Failed to complete investment assessment.', key: 'inv_load' });
    } finally {
      setRunningAnalysis(false);
    }
  };

  const getRecommendationTag = (recommendation: string) => {
    if (!recommendation) return <Tag color="gray" style={{ fontSize: 14, padding: '4px 12px' }}>N/A</Tag>;
    const rec = recommendation.toUpperCase();
    if (rec.includes('STRONG BUY')) return <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>STRONG BUY</Tag>;
    if (rec.includes('BUY')) return <Tag color="cyan" style={{ fontSize: 14, padding: '4px 12px' }}>BUY</Tag>;
    if (rec.includes('HOLD')) return <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>HOLD</Tag>;
    return <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>AVOID</Tag>;
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>Investment Analytics</Title>
          <Paragraph style={{ color: '#94A3B8', marginTop: 4, margin: 0 }}>
            Assess asset strength, addressable market indicators, operational margins, and valuation safety.
          </Paragraph>
        </div>

        {/* Document Selector */}
        <Space size="middle">
          <Text style={{ color: '#94A3B8' }}>Select Target Document:</Text>
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

      <Divider style={{ margin: '12px 0 24px 0', borderColor: '#334155' }} />

      {!selectedDocId ? (
        <Card className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
          <InfoCircleOutlined style={{ fontSize: 48, color: '#3B82F6', marginBottom: 16 }} />
          <Title level={4}>No Active Document Context Selected</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Please select a completed document from the dropdown above or go to the Dashboard to set your target context.
          </Paragraph>
        </Card>
      ) : runningAnalysis ? (
        <Card className="glass-panel" style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24 }}>VC Valuation Engine Active</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Evaluating operating margins, capital efficiency, intellectual property assets, and market comps. This might take up to 30 seconds.
          </Paragraph>
        </Card>
      ) : !report ? (
        <Card className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
          <PieChartOutlined style={{ fontSize: 48, color: '#10B981', marginBottom: 16 }} />
          <Title level={4}>Investment Analysis Pending</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            A structured investment evaluation has not yet been executed for <strong>{selectedDoc?.file_name}</strong>.
          </Paragraph>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={handleRunAnalysis}
            style={{ marginTop: 16, height: 46, backgroundColor: '#10B981', borderColor: '#10B981' }}
          >
            Execute AI Investment Analysis
          </Button>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Top Level Summary card */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className="glass-panel" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: '#94A3B8', display: 'block', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Investment Grade Score
                </Text>
                <div style={{ padding: '24px 0' }}>
                  <Progress
                    type="dashboard"
                    percent={report.investment_score}
                    strokeColor="#10B981"
                    trailColor="#1E293B"
                    strokeWidth={8}
                    format={(percent) => (
                      <span style={{ color: '#10B981', fontWeight: 800, fontSize: 24 }}>
                        {percent}%
                      </span>
                    )}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  {getRecommendationTag(report.recommendation)}
                  <Text style={{ color: '#64748B', fontSize: 12 }}>
                    Analyst Confidence: {report.confidence_score}%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Card title="Valuation Insight & Competitiveness" className="glass-panel" style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 16, right: 16 }}>
                  <Space>
                    {reportFiles?.pdf_path && (
                      <Button
                        type="default"
                        icon={<FilePdfOutlined />}
                        href={reportFiles.pdf_path}
                        target="_blank"
                      >
                        PDF
                      </Button>
                    )}
                    {reportFiles?.docx_path && (
                      <Button
                        type="default"
                        icon={<FileWordOutlined />}
                        href={reportFiles.docx_path}
                        target="_blank"
                      >
                        DOCX
                      </Button>
                    )}
                  </Space>
                </div>
                <div style={{ marginTop: 24 }}>
                  <Paragraph style={{ color: '#E2E8F0', fontSize: 15, lineHeight: '1.6' }}>
                    {report.valuation_insight}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Strengths and Weaknesses */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Core Strategic Strengths" className="glass-panel" headStyle={{ borderBottom: '1px solid #334155' }}>
                <ul style={{ paddingLeft: 18, color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(report.strengths || []).map((strength: string, i: number) => (
                    <li key={i} style={{ color: '#F8FAFC' }}>
                      <Text style={{ color: '#E2E8F0' }}>{strength}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Identified Weaknesses & Threats" className="glass-panel" headStyle={{ borderBottom: '1px solid #334155' }}>
                <ul style={{ paddingLeft: 18, color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(report.weaknesses || []).map((weakness: string, i: number) => (
                    <li key={i} style={{ color: '#EF4444' }}>
                      <Text style={{ color: '#E2E8F0' }}>{weakness}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>

          {/* Verdict callout */}
          <Card title="Final Analyst Investment Verdict" className="glass-panel" style={{ borderLeft: '4px solid #10B981' }}>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 14, fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>
              "{report.final_analyst_opinion}"
            </Paragraph>
          </Card>
        </Space>
      )}
    </div>
  );
};

export default InvestmentAnalysis;
