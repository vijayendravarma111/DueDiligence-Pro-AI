import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { UseApp } from '../App';
import api from '../api';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { setToken, setUser } = UseApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onFinish = async (values: { email: string; password: string }) => {
    // 1. Email validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      return message.warning('Please enter a valid email format with domain (e.g. user@example.com).');
    }

    setLoading(true);
    // Show interactive loading message
    message.loading({ content: 'Authenticating credentials...', key: 'login_key', duration: 0 });

    try {
      const res = await api.post('/auth/login-json', {
        email: values.email,
        password: values.password,
      });
      
      setToken(res.data.access_token);
      
      // Fetch user details
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` }
      });
      setUser(userRes.data);
      
      message.success({ content: 'Welcome back! Security terminal accessed.', key: 'login_key', duration: 3 });
      navigate('/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Incorrect email or password. Please try again.';
      message.error({ content: errMsg, key: 'login_key', duration: 4 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1E293B 0%, #0F172A 70%)',
      padding: 16
    }}>
      <Card className="glass-panel" style={{ width: 440, border: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 22,
              fontWeight: 800
            }}>D</div>
            <Title level={2} style={{ margin: 0, fontFamily: "'Outfit', sans-serif" }}>DueDiligence Pro AI</Title>
          </Space>
          <br/>
          <Text style={{ color: '#94A3B8' }}>AI-Powered Investment Analysis & Audit Suite</Text>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onFinish({ email, password });
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: 8, fontSize: 13 }}>Email Address</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<MailOutlined style={{ color: '#64748B' }} />}
              placeholder="analyst@firm.com"
              type="email"
              required
              size="large"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: 8, fontSize: 13 }}>Password</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<LockOutlined style={{ color: '#64748B' }} />}
              placeholder="••••••••"
              required
              size="large"
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ height: 46, fontWeight: 600 }}
          >
            Access Terminal
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ color: '#64748B' }}>
            New to DueDiligence Pro?{' '}
            <Link to="/register" style={{ color: '#3B82F6', fontWeight: 500 }}>
              Request Portal Access
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
