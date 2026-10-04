import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CloudUploadOutlined,
  FileSearchOutlined,
  WarningOutlined,
  FundOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/upload',
      icon: <CloudUploadOutlined />,
      label: 'Upload Document',
    },
    {
      key: '/summary',
      icon: <FileSearchOutlined />,
      label: 'Executive Summary',
    },
    {
      key: '/risk',
      icon: <WarningOutlined />,
      label: 'Risk Analysis',
    },
    {
      key: '/investment',
      icon: <FundOutlined />,
      label: 'Investment Analysis',
    },
    {
      key: '/qa',
      icon: <QuestionCircleOutlined />,
      label: 'AI Q&A',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0F172A' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: '#1E293B',
          borderRight: '1px solid #334155',
        }}
        width={240}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #334155' }}>
          <Space align="center">
            <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
            {!collapsed && (
              <Title level={4} style={{ color: '#F8FAFC', margin: 0, fontWeight: 700 }}>
                DueDiligence Pro
              </Title>
            )}
          </Space>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#1E293B', marginTop: '12px' }}
        />
      </Sider>

      <Layout style={{ background: '#0F172A' }}>
        <Header
          style={{
            background: '#1E293B',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155',
          }}
        >
          <div>
            <Text type="secondary" style={{ color: '#94A3B8' }}>
              Enterprise AI Document Due Diligence Platform
            </Text>
          </div>

          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#3B82F6' }} icon={<UserOutlined />} />
                <Text style={{ color: '#F8FAFC', fontWeight: 500 }}>
                  {user?.name || user?.email || 'User'}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
