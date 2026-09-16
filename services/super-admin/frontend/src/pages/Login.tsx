import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFinish(values: { email: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: palette.bg,
      }}
    >
      <Card style={{ width: 400, borderRadius: 14 }} styles={{ body: { padding: 32 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: `linear-gradient(135deg, ${palette.primaryActive}, ${palette.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            D
          </div>
          <Typography.Text style={{ color: palette.textBase, fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>
            DECORATION
          </Typography.Text>
        </div>

        <Typography.Title level={4} style={{ color: palette.textBase, marginBottom: 4 }}>
          Welcome back 👋
        </Typography.Title>
        <Typography.Text style={{ color: palette.textSecondary }}>
          Sign in to manage tenants and applications
        </Typography.Text>

        {error && <Alert type="error" message={error} style={{ marginTop: 16 }} />}

        <Form layout="vertical" onFinish={handleFinish} style={{ marginTop: 24 }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input autoFocus placeholder="admin@decoration.local" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 8 }}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
