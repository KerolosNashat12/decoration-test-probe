import { useEffect, useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Button, Space, message, Spin, Alert, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { ALL_TENANT_CATEGORIES, type Product, type TenantCategory } from '../../types';

interface ProductFormValues {
  name: string;
  category: TenantCategory;
  description?: string;
  price: number;
  unit: string;
  photoUrl?: string;
  isActive: boolean;
}

export function ProductFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form] = Form.useForm<ProductFormValues>();
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    apiClient
      .get<Product>(`/catalog/${id}`)
      .then(({ data }) =>
        form.setFieldsValue({
          name: data.name,
          category: data.category,
          description: data.description ?? undefined,
          price: Number(data.price),
          unit: data.unit,
          photoUrl: data.photoUrl ?? undefined,
          isActive: data.isActive,
        }),
      )
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(values: ProductFormValues) {
    setSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/catalog/${id}`, values);
      } else {
        await apiClient.post('/catalog', values);
      }
      message.success(t('catalog.form.saveSuccess'));
      navigate('/catalog');
    } catch {
      message.error(t('catalog.form.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: t('catalog.form.discardConfirm.title'),
        content: t('catalog.form.discardConfirm.description'),
        okText: t('catalog.form.discardConfirm.ok'),
        cancelText: t('catalog.form.discardConfirm.cancel'),
        okButtonProps: { danger: true },
        onOk: () => navigate('/catalog'),
      });
    } else {
      navigate('/catalog');
    }
  }

  const categoryOptions = ALL_TENANT_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound) {
    return <Alert type="warning" showIcon message={t('catalog.form.notFound')} />;
  }

  return (
    <>
      <PageHeader title={isEdit ? t('catalog.form.editTitle') : t('catalog.form.addTitle')} />

      <Card style={{ borderRadius: 14, maxWidth: 560 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label={t('catalog.form.name')}
            rules={[{ required: true, min: 2, max: 120, message: t('catalog.form.nameRule') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="category" label={t('catalog.form.category')} rules={[{ required: true }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item name="description" label={t('catalog.form.description')}>
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="price"
              label={t('catalog.form.price')}
              rules={[{ required: true, type: 'number', min: 0.01, message: t('catalog.form.priceRule') }]}
              style={{ width: '60%' }}
            >
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="unit"
              label={t('catalog.form.unit')}
              rules={[{ required: true }]}
              style={{ width: '40%' }}
            >
              <Input placeholder={t('catalog.form.unitPlaceholder')} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="photoUrl" label={t('catalog.form.photoUrl')}>
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item name="isActive" label={t('catalog.form.isActive')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEdit ? t('catalog.form.saveChanges') : t('catalog.form.save')}
            </Button>
            <Button onClick={handleCancel}>{t('catalog.form.cancel')}</Button>
          </Space>
        </Form>
      </Card>
    </>
  );
}
