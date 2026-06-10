import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Badge, Space, Typography, Empty, Tooltip, Alert, Divider, message } from 'antd';
import {
  FileTextOutlined,
  AlertOutlined,
  LineChartOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { UseApp } from '../App';
import api from '../api';

const { Title, Paragraph, Text } = Typography;

const Dashboard: React.FC = () => {
  const { company, selectedDocId, setSelectedDocId, companies } = UseApp();
  const [kpis, setKpis] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const kpiRes = await api.get('/dashboard/kpis', { params: { company_id: company.id } });
      setKpis(kpiRes.data);

      const trendRes = await api.get('/dashboard/trends', { params: { company_id: company.id } });
      setTrends(trendRes.data);

      const docRes = await api.get('/documents/', { params: { company_id: company.id } });
      setDocuments(docRes.data);
      
      // Auto-select latest completed document if none is selected
      if (docRes.data.length > 0 && !selectedDocId) {
        const firstCompleted = docRes.data.find((d: any) => d.status === 'completed');
        if (firstCompleted) {
          setSelectedDocId(firstCompleted.id);
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      message.error('Error fetching analytics database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for documents every 5 seconds to catch completed background processing
    const interval = setInterval(() => {
      if (company) {
        api.get('/documents/', { params: { company_id: company.id } })
          .then(res => {
            setDocuments(res.data);
            api.get('/dashboard/kpis', { params: { company_id: company.id } }).then(kpi => setKpis(kpi.data));
            api.get('/dashboard/trends', { params: { company_id: company.id } }).then(tr => setTrends(tr.data));
          })
          .catch(err => console.error(err));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [company]);

  const selectDocument = (doc: any) => {
    if (doc.status !== 'completed') {
      return message.warning('Document is still processing. Please wait for completion.');
    }
    setSelectedDocId(doc.id);
    message.success(`Analysis context focused on: ${doc.file_name}`);
  };

  const columns = [
    {
      title: 'Document Name',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: any) => (
        <Space>
          <FileTextOutlined style={{ color: '#3B82F6' }} />
          <span style={{ fontWeight: 500, color: '#E2E8F0' }}>{text}</span>
          {selectedDocId === record.id && (
            <Badge status="processing" text="Active Focus" style={{ marginLeft: 8 }} />
          )}
        </Space>
      )
    },
    {
      title: 'Upload Date',
      dataIndex: 'upload_date',
      key: 'upload_date',
      render: (dateStr: string) => new Date(dateStr).toLocaleDateString()
    },
    {
      title: 'Risk Score',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score: number | null) => {
        if (score === null) return <Text style={{ color: '#64748B' }}>N/A</Text>;
        const color = score > 70 ? '#EF4444' : (score > 40 ? '#F59E0B' : '#10B981');
        return <Text style={{ color, fontWeight: 700 }}>{score}/100</Text>;
      }
    },
    {
      title: 'Investment Score',
      dataIndex: 'investment_score',
      key: 'investment_score',
      render: (score: number | null) => {
        if (score === null) return <Text style={{ color: '#64748B' }}>N/A</Text>;
        const color = score > 75 ? '#10B981' : (score > 50 ? '#F59E0B' : '#EF4444');
        return <Text style={{ color, fontWeight: 700 }}>{score}/100</Text>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'completed') {
          return <Badge status="success" text="Completed" />;
        } else if (status === 'failed') {
          return <Badge status="error" text="Failed" />;
        }
        return (
          <Tooltip title="Text extraction, chunking, and AI embedding generation typically take 10-15 seconds. Please wait.">
            <Space>
              <LoadingOutlined style={{ color: '#3B82F6' }} />
              <span style={{ color: '#3B82F6', cursor: 'help' }}>Analyzing...</span>
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: 'Context',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type={selectedDocId === record.id ? 'primary' : 'default'}
          size="small"
          icon={selectedDocId === record.id ? <CheckOutlined /> : undefined}
          disabled={record.status !== 'completed'}
          onClick={() => selectDocument(record)}
        >
          {selectedDocId === record.id ? 'Focused' : 'Set Focus'}
        </Button>
      )
    }
  ];

  // If there are no companies at all
  if (companies.length === 0) {
    return (
      <div className="animate-fade-in" style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
        <Card className="glass-panel" style={{ textAlign: 'center', padding: '24px 0' }}>
          <InfoCircleOutlined style={{ fontSize: 64, color: '#3B82F6', marginBottom: 20 }} />
          <Title level={3}>Welcome to DueDiligence Pro AI! 👋</Title>
          <Paragraph style={{ color: '#94A3B8', fontSize: 15 }}>
            To get started, we need to create a company workspace.
          </Paragraph>
          <Alert
            message="👉 Step 1: Onboard a Company"
            description="Click the '+ Onboard Company' button in the top left header bar to create your first client context (e.g. Apple, Google, or Acme Corp)."
            type="info"
            showIcon
            style={{ textAlign: 'left', margin: '20px 24px' }}
          />
        </Card>
      </div>
    );
  }

  // If companies exist but none is selected as active
  if (!company) {
    return (
      <div className="animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ color: '#94A3B8' }}>
              <Title level={4} style={{ color: '#E2E8F0', marginBottom: 8 }}>Workspace Context Muted</Title>
              Select an active company from the top bar dropdown menu to load files and scorecards.
            </div>
          }
        />
      </div>
    );
  }

  const hasUnfocusedDoc = documents.length > 0 && !selectedDocId;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>
          {company.name} Workspace
        </Title>
        <Paragraph style={{ color: '#94A3B8', marginTop: 4, margin: 0 }}>
          Executive Risk Audit & Venture Analytics Dashboard
        </Paragraph>
      </div>

      {/* Onboarding Guide Banners */}
      {documents.length === 0 && (
        <Alert
          message="👉 Step 2: Upload Business Files"
          description="You don't have any files in this workspace yet. Navigate to the 'Upload' page on the left menu to drag-and-drop your PDF or DOCX agreements."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {hasUnfocusedDoc && (
        <Alert
          message="👉 Step 3: Select Active Focus Document"
          description="To run audits, valuation checks, or ask AI queries, click the 'Set Focus' button on a completed document in the registry below."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable className="glass-panel">
            <Statistic
              title="Documents Processed"
              value={kpis?.documents_uploaded || 0}
              prefix={<FileTextOutlined style={{ color: '#3B82F6', marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable className="glass-panel">
            <Statistic
              title="Average Risk Rating"
              value={kpis?.avg_risk_score || 0}
              suffix="/ 100"
              valueStyle={{
                color: (kpis?.avg_risk_score || 0) > 70 ? '#EF4444' : ((kpis?.avg_risk_score || 0) > 40 ? '#F59E0B' : '#10B981')
              }}
              prefix={<AlertOutlined style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable className="glass-panel">
            <Statistic
              title="Avg Investment Score"
              value={kpis?.avg_investment_score || 0}
              suffix="/ 100"
              valueStyle={{
                color: (kpis?.avg_investment_score || 0) > 75 ? '#10B981' : ((kpis?.avg_investment_score || 0) > 50 ? '#F59E0B' : '#EF4444')
              }}
              prefix={<LineChartOutlined style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable className="glass-panel">
            <Statistic
              title="Cognitive Queries"
              value={kpis?.total_ai_queries || 0}
              prefix={<MessageOutlined style={{ color: '#A855F7', marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart Trends */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Risk Trend Timeline" bordered={false} className="glass-panel">
            <div style={{ height: 260 }}>
              {trends?.risk_trend && trends.risk_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.risk_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94A3B8" />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', color: '#F8FAFC' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No sufficient completed audit records to map trends." style={{ paddingTop: 40 }} />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Investment Score Timeline" bordered={false} className="glass-panel">
            <div style={{ height: 260 }}>
              {trends?.investment_trend && trends.investment_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.investment_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94A3B8" />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', color: '#F8FAFC' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No sufficient completed audit records to map trends." style={{ paddingTop: 40 }} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Document History Table */}
      <Card title="Company Document Registry" bordered={false} className="glass-panel">
        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          locale={{ emptyText: <Empty description="No documents uploaded yet. Go to Upload to ingest your first files." /> }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
