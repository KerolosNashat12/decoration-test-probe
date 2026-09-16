import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm<ChangePasswordValues>();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: ChangePasswordValues) {
    setSaving(true);
    try {
      await apiClient.patch('/auth/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(t('settings.changePassword.success'));
      form.resetFields();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      message.error(status === 401 ? t('settings.changePassword.wrongCurrent') : t('common.loadError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Card title={t('settings.changePassword.cardTitle')} style={{ borderRadius: 14, maxWidth: 440 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="currentPassword" label={t('settings.changePassword.currentPassword')} rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('settings.changePassword.newPassword')}
            rules={[{ required: true, min: 8, message: t('settings.changePassword.tooShort') }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('settings.changePassword.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t('settings.changePassword.mismatch')));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            {t('settings.changePassword.submit')}
          </Button>
        </Form>
      </Card>
    </>
  );
}
