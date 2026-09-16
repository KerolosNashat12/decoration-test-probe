import { useState } from 'react';
import { Card, Form, Input, Button, message, Row, Col, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  const { t } = useTranslation();
  const { admin, updateAdmin } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSave(values: { name: string; email: string }) {
    setSavingProfile(true);
    try {
      const { data } = await apiClient.patch('/admin-users/me', values);
      updateAdmin({ name: data.name, email: data.email });
      message.success(t('settings.profileUpdateSuccess'));
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('settings.profileUpdateError'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(values: { currentPassword: string; newPassword: string }) {
    setSavingPassword(true);
    try {
      await apiClient.patch('/admin-users/me/password', values);
      message.success(t('settings.passwordUpdateSuccess'));
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('settings.passwordUpdateError'));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('settings.profileTitle')} style={{ borderRadius: 14, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Tag color={admin?.role === 'SUPER_ADMIN' ? 'blue' : 'default'} style={{ margin: 0 }}>
                {admin?.role === 'SUPER_ADMIN' ? t('adminUsers.roleOptions.SUPER_ADMIN') : t('adminUsers.roleOptions.REVIEWER')}
              </Tag>
            </div>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{ name: admin?.name, email: admin?.email }}
              onFinish={handleProfileSave}
            >
              <Form.Item name="name" label={t('settings.form.name')} rules={[{ required: true, min: 2 }]}>
                <Input prefix={<UserOutlined style={{ color: palette.textTertiary }} />} />
              </Form.Item>
              <Form.Item name="email" label={t('settings.form.email')} rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                {t('common.saveChanges')}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('settings.passwordTitle')} style={{ borderRadius: 14, height: '100%' }}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item name="currentPassword" label={t('settings.currentPassword')} rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
              </Form.Item>
              <Form.Item name="newPassword" label={t('settings.newPassword')} rules={[{ required: true, min: 8 }]}>
                <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={t('settings.confirmPassword')}
                dependencies={['newPassword']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error(t('settings.confirmMismatch')));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: palette.textTertiary }} />} />
              </Form.Item>
              <Divider style={{ margin: '4px 0 20px' }} />
              <Button type="primary" htmlType="submit" loading={savingPassword}>
                {t('settings.updatePassword')}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
}
