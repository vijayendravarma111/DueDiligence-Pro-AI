import React, { useState } from 'react';
import { Card, Typography, Space, Input, Button, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onFinish = async (values: any) => {
    // 1. Email validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      return message.warning('Please enter a valid email format with domain (e.g. user@example.com).');
    }

    // 2. Passwords equality check
    if (values.password !== values.confirmPassword) {
      return message.error('Passwords do not match. Please re-enter.');
    }

    setLoading(true);
    // Show interactive loading message
    message.loading({ content: 'Creating security profile...', key: 'register_key', duration: 0 });

    try {
      await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        role: 'analyst'
      });
      message.success({ content: 'Account registered successfully. Redirecting to login...', key: 'register_key', duration: 3 });
      navigate('/login');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed. The email may already exist.';
      message.error({ content: errMsg, key: 'register_key', duration: 4 });
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
            <Title level={2} style={{ margin: 0, fontFamily: "'Outfit', sans-serif" }}>Create Account</Title>
          </Space>
          <br/>
          <Text style={{ color: '#94A3B8' }}>Join the Risk & Investment Audit Network</Text>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onFinish({ email, password, confirmPassword });
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

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: 8, fontSize: 13 }}>Password</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<LockOutlined style={{ color: '#64748B' }} />}
              placeholder="Min 6 characters"
              required
              size="large"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: 8, fontSize: 13 }}>Confirm Password</label>
            <Input.Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              prefix={<SafetyOutlined style={{ color: '#64748B' }} />}
              placeholder="Repeat your password"
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
            Create Security Profile
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ color: '#64748B' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#3B82F6', fontWeight: 500 }}>
              Access Account
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
