import React, { useState } from 'react';
import { Card, Typography, Space, Input, Button, List, Divider, Badge, Tag, message } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  UserOutlined,
  BankOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Title, Paragraph, Text } = Typography;

const Settings: React.FC = () => {
  const { user, company, companies, setCompany, fetchCompanies, logout } = UseApp();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      return message.warning('Please enter a company name.');
    }
    setLoading(true);
    try {
      const res = await api.post('/companies/', { name: newCompanyName });
      message.success(`Company "${res.data.name}" registered successfully.`);
      await fetchCompanies();
      setCompany(res.data);
      setNewCompanyName('');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to onboard company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontFamily: "'Outfit', sans-serif", margin: 0 }}>System Settings</Title>
        <Paragraph style={{ color: '#94A3B8', marginTop: 4 }}>
          Manage your organizational contexts, tenant company profiles, and user sessions.
        </Paragraph>
      </div>

      <Divider style={{ margin: '12px 0 24px 0', borderColor: '#334155' }} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* User Account Settings */}
        <Card title={
          <Space>
            <UserOutlined style={{ color: '#3B82F6' }} />
            <span>Profile Configuration</span>
          </Space>
        } className="glass-panel" bordered={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Text style={{ color: '#94A3B8', display: 'block', fontSize: 12 }}>EMAIL ADDRESS</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 500 }}>{user?.email}</Text>
            </div>
            <div>
              <Text style={{ color: '#94A3B8', display: 'block', fontSize: 12 }}>SYSTEM ACCESS ROLE</Text>
              <Space style={{ marginTop: 4 }}>
                <Badge status="processing" />
                <Text style={{ color: '#F8FAFC', fontSize: 14, textTransform: 'capitalize' }}>
                  {user?.role || 'analyst'}
                </Text>
              </Space>
            </div>
          </div>
        </Card>

        {/* Company Context Workspace settings */}
        <Card title={
          <Space>
            <BankOutlined style={{ color: '#10B981' }} />
            <span>Company Workspaces</span>
          </Space>
        } className="glass-panel" bordered={false}>
          <div style={{ marginBottom: 24 }}>
            <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 12 }}>ACTIVE WORKSPACE FOCUS</Text>
            {company ? (
              <Card size="small" style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
                <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Text style={{ color: '#F8FAFC', fontWeight: 600 }}>{company.name}</Text>
                  <Tag color="green">Active</Tag>
                </Space>
              </Card>
            ) : (
              <Text style={{ color: '#EF4444' }}>No active company context. Register one below.</Text>
            )}
          </div>

          <Divider style={{ borderColor: '#334155' }} />

          {/* Create Company Form */}
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 8 }}>ONBOARD NEW COMPANY</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                maxLength={100}
                onPressEnter={handleCreateCompany}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateCompany}
                loading={loading}
              >
                Onboard
              </Button>
            </Space.Compact>
          </div>

          {companies.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 12 }}>REGISTERED CLIENTS</Text>
              <List
                size="small"
                bordered
                dataSource={companies}
                style={{ borderColor: '#334155', borderRadius: 8 }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        disabled={company?.id === item.id}
                        onClick={() => {
                          setCompany(item);
                          message.success(`Workspace focus changed to: ${item.name}`);
                        }}
                      >
                        {company?.id === item.id ? 'Active' : 'Select'}
                      </Button>
                    ]}
                    style={{ borderBottom: '1px solid #334155' }}
                  >
                    <Text style={{ color: company?.id === item.id ? '#3B82F6' : '#E2E8F0', fontWeight: company?.id === item.id ? 600 : 400 }}>
                      {item.name}
                    </Text>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>

        {/* Security & session */}
        <Card title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#EAB308' }} />
            <span>Terminal Access</span>
          </Space>
        } className="glass-panel" bordered={false}>
          <Paragraph style={{ color: '#94A3B8' }}>
            Logging out will invalidate the active JWT security credentials in the localStorage header context.
          </Paragraph>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
            Terminate Session
          </Button>
        </Card>
      </Space>
    </div>
  );
};

export default Settings;
