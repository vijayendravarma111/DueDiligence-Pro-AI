import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Spin, message, Popconfirm } from 'antd';
import {
  FileTextOutlined,
  CloudUploadOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DocumentItem } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      message.error('Could not load documents from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/documents/${id}`);
      message.success('Document deleted successfully.');
      fetchDocuments();
    } catch (error: any) {
      message.error('Failed to delete document.');
    }
  };

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string, record: DocumentItem) => (
        <Space>
          <FileTextOutlined style={{ color: '#3B82F6' }} />
          <Text
            style={{ color: '#F8FAFC', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate(`/documents/${record.id}`)}
          >
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => (
        <Tag color={type.toLowerCase() === 'pdf' ? 'red' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Upload Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text style={{ color: '#94A3B8' }}>
          {new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'completed') {
          return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
        } else if (status === 'processing') {
          return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
        } else {
          return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DocumentItem) => (
        <Space size="small">
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/documents/${record.id}`)}
            style={{ background: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
          >
            Details
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<QuestionCircleOutlined />}
            onClick={() => navigate(`/qa?doc_id=${record.id}`)}
            style={{ background: '#3B82F6' }}
          >
            Ask AI
          </Button>
          <Popconfirm
            title="Delete Document"
            description="Are you sure you want to delete this document?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
            Document Analytics Dashboard
          </Title>
          <Text style={{ color: '#94A3B8' }}>
            Overview of uploaded due diligence files and AI index status
          </Text>
        </div>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          size="large"
          onClick={() => navigate('/upload')}
          style={{ background: '#3B82F6', fontWeight: 600 }}
        >
          Upload New Document
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}>
            <Text type="secondary" style={{ color: '#94A3B8' }}>Total Documents</Text>
            <Title level={2} style={{ color: '#F8FAFC', margin: '8px 0 0 0' }}>
              {documents.length}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}>
            <Text type="secondary" style={{ color: '#94A3B8' }}>Indexed & Ready</Text>
            <Title level={2} style={{ color: '#10B981', margin: '8px 0 0 0' }}>
              {documents.filter((d) => d.status === 'completed').length}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}>
            <Text type="secondary" style={{ color: '#94A3B8' }}>Supported Formats</Text>
            <Title level={2} style={{ color: '#3B82F6', margin: '8px 0 0 0' }}>
              PDF / DOCX
            </Title>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Text style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 16 }}>
            Recent Documents
          </Text>
        }
        style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            style={{ background: '#1E293B' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
