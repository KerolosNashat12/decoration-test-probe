import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFinish(values: { email: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('login.error'));
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
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, insetInlineEnd: 20 }}>
        <LanguageSwitcher />
      </div>
      <Card style={{ width: 400, borderRadius: 14 }} styles={{ body: { padding: 32 } }}>
        <Space style={{ marginBottom: 24 }} size={10}>
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
        </Space>

        <Typography.Title level={4} style={{ color: palette.textBase, marginBottom: 4 }}>
          {t('login.welcome')}
        </Typography.Title>
        <Typography.Text style={{ color: palette.textSecondary }}>{t('login.subtitle')}</Typography.Text>

        {error && <Alert type="error" message={error} style={{ marginTop: 16 }} />}

        <Form layout="vertical" onFinish={handleFinish} style={{ marginTop: 24 }}>
          <Form.Item name="email" label={t('login.email')} rules={[{ required: true, type: 'email' }]}>
            <Input autoFocus placeholder="admin@decoration.local" />
          </Form.Item>
          <Form.Item name="password" label={t('login.password')} rules={[{ required: true }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 8 }}>
            {t('login.signIn')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
