import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../services/api';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      const { access_token, user } = response.data;
      setAuth(access_token, user);
      message.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.detail || 'Registration failed. Please try again.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#1E293B',
          borderColor: '#334155',
          borderRadius: 12,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space align="center" style={{ marginBottom: 12 }}>
            <SafetyCertificateOutlined style={{ fontSize: 36, color: '#3B82F6' }} />
            <Title level={2} style={{ color: '#F8FAFC', margin: 0, fontWeight: 700 }}>
              DueDiligence Pro
            </Title>
          </Space>
          <div>
            <Text type="secondary" style={{ color: '#94A3B8' }}>
              Create an account to start analyzing documents
            </Text>
          </div>
        </div>

        <Form name="register" layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="name"
            label={<Text style={{ color: '#E2E8F0' }}>Full Name</Text>}
            rules={[{ required: true, message: 'Please input your full name!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#64748B' }} />}
              placeholder="John Doe"
              size="large"
              style={{ background: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<Text style={{ color: '#E2E8F0' }}>Email Address</Text>}
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#64748B' }} />}
              placeholder="name@company.com"
              size="large"
              style={{ background: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#E2E8F0' }}>Password</Text>}
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#64748B' }} />}
              placeholder="Minimum 6 characters"
              size="large"
              style={{ background: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ background: '#3B82F6', fontWeight: 600, height: 44 }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text style={{ color: '#94A3B8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3B82F6', fontWeight: 500 }}>
              Sign in
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
