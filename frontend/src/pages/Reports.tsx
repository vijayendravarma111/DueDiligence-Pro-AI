import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Button, Space, Tag, Divider, Empty, message } from 'antd';
import {
  FolderOpenOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  ReloadOutlined,
  BankOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Title, Paragraph } = Typography;

const Reports: React.FC = () => {
  const { company } = UseApp();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Since we also want to display Document name and Company name in the table, we'll fetch them
  const [documents, setDocuments] = useState<any[]>([]);

  const fetchReportsData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      // Fetch documents to map document names
      const docRes = await api.get('/documents/', { params: { company_id: company.id } });
      setDocuments(docRes.data);

      const res = await api.get('/reports/', { params: { company_id: company.id } });
      setReports(res.data);
    } catch (e) {
      console.error(e);
      message.error('Failed to retrieve reports checklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [company]);

  const columns = [
    {
      title: 'Report Name',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span style={{ fontWeight: 500, color: '#E2E8F0' }}>{text}</span>
      )
    },
    {
      title: 'Report Type',
      dataIndex: 'report_type',
      key: 'report_type',
      render: (type: string) => {
        const t = type.toLowerCase();
        if (t === 'risk') return <Tag color="red">Risk Audit</Tag>;
        if (t === 'investment') return <Tag color="green">Venture Valuation</Tag>;
        return <Tag color="blue">AI Q&A Brief</Tag>;
      }
    },
    {
      title: 'Associated Document',
      dataIndex: 'document_id',
      key: 'document_id',
      render: (docId: number) => {
        const doc = documents.find(d => d.id === docId);
        return (
          <Space>
            <FileTextOutlined style={{ color: '#64748B' }} />
            <span>{doc ? doc.file_name : `Doc #${docId}`}</span>
          </Space>
        );
      }
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr: string) => new Date(dateStr).toLocaleString()
    },
    {
      title: 'Downloads',
      key: 'downloads',
      render: (_: any, record: any) => (
        <Space size="middle">
          {record.pdf_path ? (
            <Button
              type="primary"
              size="small"
              icon={<FilePdfOutlined />}
              href={record.pdf_path}
              target="_blank"
            >
              PDF
            </Button>
          ) : (
            <Button type="primary" size="small" icon={<FilePdfOutlined />} disabled>
              PDF
            </Button>
          )}
          
          {record.docx_path ? (
            <Button
              type="default"
              size="small"
              icon={<FileWordOutlined />}
              href={record.docx_path}
              target="_blank"
            >
              DOCX
            </Button>
          ) : (
            <Button type="default" size="small" icon={<FileWordOutlined />} disabled>
              DOCX
            </Button>
          )}
        </Space>
      )
    }
  ];

  if (!company) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Please select or onboard a company workspace to view reports."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>Reports Archive</Title>
          <Paragraph style={{ color: '#94A3B8', marginTop: 4, margin: 0 }}>
            Browse and download historical compliance risk models, PE/VC investment audits, and contextual chat summaries.
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchReportsData} loading={loading}>
          Refresh
        </Button>
      </div>

      <Divider style={{ margin: '12px 0 24px 0', borderColor: '#334155' }} />

      <Card title={
        <Space>
          <FolderOpenOutlined style={{ color: '#3B82F6' }} />
          <span>Workspace Reports for {company.name}</span>
        </Space>
      } className="glass-panel" bordered={false}>
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No reports generated yet. Execute Risk or Investment analysis to populate the index." /> }}
        />
      </Card>
    </div>
  );
};

export default Reports;
