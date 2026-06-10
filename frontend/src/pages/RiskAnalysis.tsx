import React, { useEffect, useState } from 'react';
import { Card, Select, Button, Typography, Row, Col, Progress, Space, Divider, Alert, Spin, message } from 'antd';
import {
  FileTextOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Title, Paragraph, Text } = Typography;

const RiskAnalysis: React.FC = () => {
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
      const res = await api.get('/reports/', { params: { document_id: docId, report_type: 'risk' } });
      if (res.data.length > 0) {
        // Fetch detailed report content
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
      message.loading({ content: 'Executing deep AI risk assessment...', key: 'risk_load' });
      const res = await api.post(`/analysis/risk/${selectedDocId}`);
      setReport(res.data);
      message.success({ content: 'Risk analysis generated successfully.', key: 'risk_load' });
      // Fetch report files again to get download paths
      await fetchExistingReport(selectedDocId);
    } catch (err: any) {
      console.error(err);
      message.error({ content: err.response?.data?.detail || 'Failed to complete risk assessment.', key: 'risk_load' });
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Color selection based on risk rating
  const getRiskColor = (score: number) => {
    if (score > 70) return '#EF4444'; // Red
    if (score > 40) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>Risk Assessment Core</Title>
          <Paragraph style={{ color: '#94A3B8', marginTop: 4, margin: 0 }}>
            Audit compliance clauses, liability covenants, governance policies, and operational risks.
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
          <Title level={4} style={{ marginTop: 24 }}>AI Risk Engine Initiated</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Evaluating legal clauses, operational threats, liability thresholds, and capitalization models. This might take up to 30 seconds.
          </Paragraph>
        </Card>
      ) : !report ? (
        <Card className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
          <WarningOutlined style={{ fontSize: 48, color: '#F59E0B', marginBottom: 16 }} />
          <Title level={4}>Risk Assessment Pending</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            A comprehensive risk audit has not yet been executed for <strong>{selectedDoc?.file_name}</strong>.
          </Paragraph>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={handleRunAnalysis}
            style={{ marginTop: 16, height: 46 }}
          >
            Execute AI Risk Analysis
          </Button>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Top Level Summary card */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className="glass-panel" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: '#94A3B8', display: 'block', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Overall Risk Score
                </Text>
                <div style={{ padding: '24px 0' }}>
                  <Progress
                    type="circle"
                    percent={report.overall_risk_score}
                    strokeColor={getRiskColor(report.overall_risk_score)}
                    trailColor="#1E293B"
                    strokeWidth={8}
                    format={(percent) => (
                      <span style={{ color: getRiskColor(percent || 0), fontWeight: 800, fontSize: 24 }}>
                        {percent}%
                      </span>
                    )}
                  />
                </div>
                <Title level={4} style={{ margin: 0, color: getRiskColor(report.overall_risk_score) }}>
                  {report.risk_level} Risk Level
                </Title>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Card className="glass-panel" style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Executive Summary</Title>
                  {/* Download Options */}
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
                <Paragraph style={{ color: '#E2E8F0', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
                  {report.executive_summary}
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* Breakdown and Key Risks */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Risk Breakdown Categories" className="glass-panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(report.risk_breakdown || {}).map(([key, value]) => {
                    const label = key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const val = value as number;
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#E2E8F0', fontWeight: 500 }}>{label}</Text>
                          <Text style={{ color: getRiskColor(val), fontWeight: 700 }}>{val}/100</Text>
                        </div>
                        <Progress
                          percent={val}
                          strokeColor={getRiskColor(val)}
                          trailColor="#1E293B"
                          showInfo={false}
                          strokeWidth={8}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Key Identified Vulnerabilities" className="glass-panel">
                <ul style={{ paddingLeft: 18, color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(report.key_risks || []).map((risk: string, i: number) => (
                    <li key={i}>
                      <Text style={{ color: '#F8FAFC', fontWeight: 500, display: 'block' }}>Risk {i + 1}</Text>
                      <Text style={{ color: '#94A3B8' }}>{risk}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>

          {/* Mitigation and Opinion */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Strategic Mitigation Actions" className="glass-panel">
                <ul style={{ paddingLeft: 18, color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(report.recommendations || []).map((rec: string, i: number) => (
                    <li key={i}>
                      <Text style={{ color: '#3B82F6', fontWeight: 600, display: 'block' }}>Mitigation Step {i + 1}</Text>
                      <Text style={{ color: '#94A3B8' }}>{rec}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Consultant Verdict" className="glass-panel" style={{ borderLeft: `4px solid ${getRiskColor(report.overall_risk_score)}` }}>
                <Paragraph style={{ color: '#E2E8F0', fontSize: 14, fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>
                  "{report.final_consultant_opinion}"
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </Space>
      )}
    </div>
  );
};

export default RiskAnalysis;
