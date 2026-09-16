import { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Button, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { ALL_TENANT_CATEGORIES, type Profile, type TenantCategory } from '../types';

export function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const categoryOptions = ALL_TENANT_CATEGORIES.map((value) => ({
    value,
    label: t(`categories.${value}`),
  }));

  useEffect(() => {
    apiClient
      .get<Profile>('/profile')
      .then(({ data }) => {
        setProfile(data);
        form.setFieldsValue(data);
      })
      .catch(() => message.error(t('profile.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(values: {
    name: string;
    contactName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    district?: string;
    categories: TenantCategory[];
  }) {
    setSaving(true);
    try {
      const { data } = await apiClient.patch<Profile>('/profile', values);
      setProfile(data);
      message.success(t('profile.updateSuccess'));
    } catch {
      message.error(t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <Card title={t('profile.cardTitle')} style={{ borderRadius: 14, maxWidth: 560 }}>
        <Form form={form} layout="vertical" initialValues={profile} onFinish={handleSave}>
          <Form.Item name="name" label={t('profile.form.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label={t('profile.form.contactName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('profile.form.phone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label={t('profile.form.whatsapp')}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('profile.form.email')}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="district" label={t('profile.form.district')}>
            <Input />
          </Form.Item>
          <Form.Item name="categories" label={t('profile.form.categories')} rules={[{ required: true }]}>
            <Select mode="multiple" options={categoryOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            {t('common.saveChanges')}
          </Button>
        </Form>
      </Card>
    </>
  );
}
