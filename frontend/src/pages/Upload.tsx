import React, { useState } from 'react';
import { Card, Upload as AntUpload, Button, Typography, message, Progress, Space, Alert } from 'antd';
import { InboxOutlined, FilePdfOutlined, FileWordOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = AntUpload;

const Upload: React.FC = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a PDF or DOCX file to upload.');
      return;
    }

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success(`Document '${response.data.filename}' uploaded and indexed successfully!`);
      navigate(`/documents/${response.data.id}`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errMsg = error.response?.data?.detail || 'Failed to upload document.';
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file: any) => {
      const isPdfOrDocx =
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.doc');

      if (!isPdfOrDocx) {
        message.error('You can only upload PDF or DOCX files!');
        return AntUpload.LIST_IGNORE;
      }

      const isLt25M = file.size / 1024 / 1024 < 25;
      if (!isLt25M) {
        message.error('File size must be smaller than 25MB!');
        return AntUpload.LIST_IGNORE;
      }

      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>
          Upload Due-Diligence Document
        </Title>
        <Text style={{ color: '#94A3B8' }}>
          Upload PDF or DOCX files for automated text extraction, chunking, vector indexing, and AI Q&A.
        </Text>
      </div>

      <Card style={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }}>
        <Dragger {...draggerProps} style={{ background: '#0F172A', borderColor: '#334155', padding: 24 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#3B82F6', fontSize: 48 }} />
          </p>
          <Title level={4} style={{ color: '#F8FAFC', marginTop: 12 }}>
            Click or drag PDF / DOCX file to this area
          </Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Supports PDF and DOCX files up to 25MB. Files will be parsed and indexed in ChromaDB for semantic search.
          </Paragraph>
          <Space size="large" style={{ marginTop: 12 }}>
            <Space style={{ color: '#E2E8F0' }}>
              <FilePdfOutlined style={{ color: '#EF4444' }} /> PDF Document
            </Space>
            <Space style={{ color: '#E2E8F0' }}>
              <FileWordOutlined style={{ color: '#3B82F6' }} /> DOCX Document
            </Space>
          </Space>
        </Dragger>

        {uploading && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Alert
              message="Processing Document..."
              description="Extracting text, generating chunk embeddings, and creating executive summary. Please wait."
              type="info"
              showIcon
              style={{ background: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
            />
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
            style={{ background: '#3B82F6', fontWeight: 600, paddingLeft: 32, paddingRight: 32 }}
          >
            Start AI Indexing
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Upload;
