import React, { useState } from 'react';
import { Card, Upload as AntUpload, message, Typography, Space, Progress, Button, Alert, Spin } from 'antd';
import { InboxOutlined, FilePdfOutlined, FileWordOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UseApp } from '../App';
import api from '../api';

const { Dragger } = AntUpload;
const { Title, Paragraph, Text } = Typography;

const Upload: React.FC = () => {
  const { company, setSelectedDocId } = UseApp();
  const navigate = useNavigate();
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);

  if (!company) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={4}>No Company Context</Title>
        <Paragraph>Please select or onboard a company prior to document ingestion.</Paragraph>
      </div>
    );
  }

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', String(company.id));

    setUploading(true);
    setProgress(0);
    setSuccess(false);

    // Show upload loading popup
    message.loading({ content: 'Document is uploading... please wait.', key: 'upload_key', duration: 0 });

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      onSuccess(res.data);
      setUploadedDoc(res.data);
      setSuccess(true);
      // Auto-set the active document to this one!
      setSelectedDocId(res.data.id);
      
      message.success({ 
        content: `"${file.name}" uploaded successfully! Background AI indexing started.`, 
        key: 'upload_key', 
        duration: 4 
      });
    } catch (err: any) {
      console.error(err);
      onError(err);
      const errDetail = err.response?.data?.detail || `Failed to upload "${file.name}".`;
      message.error({ content: errDetail, key: 'upload_key', duration: 4 });
    } finally {
      setUploading(false);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: '.pdf,.docx',
    customRequest,
    beforeUpload: (file: any) => {
      const fileName = file.name.toLowerCase();
      const isPdfOrWord = file.type === 'application/pdf' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         fileName.endsWith('.pdf') ||
                         fileName.endsWith('.docx');
      if (!isPdfOrWord) {
        message.error('Invalid format. You can only upload PDF or DOCX files.');
        return AntUpload.LIST_IGNORE;
      }
      const isLt15M = file.size / 1024 / 1024 < 15;
      if (!isLt15M) {
        message.error('Document size exceeds 15MB limit.');
        return AntUpload.LIST_IGNORE;
      }
      return true;
    },
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>Document Ingestion</Title>
        <Paragraph style={{ color: '#94A3B8', marginTop: 4 }}>
          Upload corporate filings, financial statements, contracts, or pitch decks to index them for isolated analysis.
        </Paragraph>
      </div>

      {/* Dynamic Guideline Alert */}
      <Alert
        message="👉 Step 2: Ingest Document"
        description="Select or drag a PDF or DOCX file to start the parsing pipelines. The server will extract text, segment it, and generate vector embeddings automatically in the background (typically takes 10-15 seconds)."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card className="glass-panel" style={{ border: 'none' }}>
        <Spin spinning={uploading} size="large" tip={progress > 0 ? `Uploading... ${progress}%` : "Initiating secure document upload..."}>
          {!success ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Dragger {...draggerProps} disabled={uploading}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#3B82F6', fontSize: 48 }} />
                </p>
                <p className="ant-upload-text" style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 16 }}>
                  Drag & Drop Document Here
                </p>
                <p className="ant-upload-hint" style={{ color: '#64748B', padding: '0 24px' }}>
                  Supports PDF and DOCX files up to 15MB. Your data is isolated using strict vector-field segmentation.
                </p>
              </Dragger>

              {uploading && (
                <div style={{ marginTop: 16 }}>
                  <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 8 }}>
                    Ingesting and parsing payload... (please wait for completion)
                  </Text>
                  <Progress percent={progress} strokeColor="#3B82F6" trailColor="#1E293B" />
                </div>
              )}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircleOutlined style={{ color: '#10B981', fontSize: 64, marginBottom: 16 }} />
              <Title level={3} style={{ margin: 0 }}>Processing Initialized</Title>
              <Paragraph style={{ color: '#94A3B8', marginTop: 8, marginBottom: 24 }}>
                <strong>{uploadedDoc?.file_name}</strong> was ingested. The background worker is currently extracting text, generating vector embeddings, and structuring data fields.
              </Paragraph>
              <Space size="middle">
                <Button type="primary" onClick={() => navigate('/dashboard')}>
                  View Progress Dashboard
                </Button>
                <Button type="default" onClick={() => setSuccess(false)}>
                  Ingest Another File
                </Button>
              </Space>
            </div>
          )}
        </Spin>
      </Card>

      <Card title="Security & Isolation Architecture" style={{ marginTop: 24 }} className="glass-panel">
        <Space direction="vertical" size="middle">
          <Text style={{ color: '#E2E8F0', fontWeight: 600 }}>
            🛡️ Strict Multi-Tenant Segmented RAG Architecture
          </Text>
          <Paragraph style={{ color: '#94A3B8', margin: 0 }}>
            To prevent cross-document data contamination, each document is assigned a unique primary key identifier. ChromaDB similarity vectors are queried with a static <code style={{ color: '#3B82F6', background: '#0F172A', padding: '2px 6px', borderRadius: 4 }}>where={"{"}"document_id": selected_document_id{"}"}</code> filter constraint on every query.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default Upload;
