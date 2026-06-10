import React, { useState } from 'react';
import { Layout, Menu, Button, Select, Dropdown, Space, Avatar, Modal, Input, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CloudUploadOutlined,
  AlertOutlined,
  LineChartOutlined,
  MessageOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
  BankOutlined
} from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Header, Content, Sider } = Layout;

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    company,
    companies,
    setCompany,
    fetchCompanies,
    logout
  } = UseApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Modal for new company onboarding
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/upload', icon: <CloudUploadOutlined />, label: 'Upload' },
    { key: '/risk', icon: <AlertOutlined />, label: 'Risk Analysis' },
    { key: '/investment', icon: <LineChartOutlined />, label: 'Investment Analysis' },
    { key: '/chat', icon: <MessageOutlined />, label: 'AI Assistant' },
    { key: '/reports', icon: <FolderOpenOutlined />, label: 'Reports Module' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

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
      setIsCompanyModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to register company.');
    } finally {
      setLoading(false);
    }
  };

  // User Profile Menu
  const userMenu = (
    <Menu
      items={[
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Logout',
          onClick: logout
        }
      ]}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        {/* Brand Logo Header */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          gap: 12,
          borderBottom: '1px solid #334155'
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18
          }}>D</div>
          {!collapsed && (
            <span style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '0.5px',
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(90deg, #FFFFFF 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              DueDiligence Pro
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 16 }}
        />
      </Sider>

      {/* Main App Frame */}
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        {/* Header bar */}
        <Header style={{
          position: 'sticky',
          top: 0,
          zIndex: 9,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Company Switcher Context */}
          <Space size="middle">
            <BankOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
            {companies.length > 0 ? (
              <Select
                value={company?.id}
                onChange={(value) => {
                  const selected = companies.find(c => c.id === value);
                  setCompany(selected);
                  message.success(`Switched workspace context: ${selected.name}`);
                }}
                style={{ width: 200 }}
                placeholder="Select Active Client"
                options={companies.map(c => ({ value: c.id, label: c.name }))}
              />
            ) : (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setIsCompanyModalOpen(true)}>
                Onboard Company
              </Button>
            )}
            {companies.length > 0 && (
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                style={{ color: '#94A3B8' }}
                onClick={() => setIsCompanyModalOpen(true)}
              />
            )}
          </Space>

          {/* User Badge Actions */}
          <Dropdown overlay={userMenu} placement="bottomRight" trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 500 }}>{user?.email}</span>
              <Avatar style={{ backgroundColor: '#1E293B', border: '1px solid #3B82F6' }} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>

        {/* Dynamic Route Content */}
        <Content style={{ margin: '24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {children}
        </Content>
      </Layout>

      {/* Register Company Modal */}
      <Modal
        title="Onboard New Company"
        open={isCompanyModalOpen}
        onOk={handleCreateCompany}
        onCancel={() => setIsCompanyModalOpen(false)}
        confirmLoading={loading}
        okText="Onboard"
      >
        <div style={{ margin: '16px 0' }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#94A3B8' }}>Company Name</label>
          <Input
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="e.g. Acme Tech Solutions LLC"
            maxLength={100}
            onPressEnter={handleCreateCompany}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default DashboardLayout;
