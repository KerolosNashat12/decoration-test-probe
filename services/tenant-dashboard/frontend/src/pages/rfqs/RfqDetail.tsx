import { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Form,
  InputNumber,
  Input,
  Select,
  Button,
  Space,
  Spin,
  Alert,
  message,
  Modal,
  Typography,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { palette } from '../../theme';
import type { Paginated, Product, Rfq, RfqStatus } from '../../types';

const STATUS_COLORS: Record<RfqStatus, string> = {
  NEW: 'blue',
  RESPONDED: 'green',
  DECLINED: 'red',
  EXPIRED: 'default',
};

interface RespondFormValues {
  price: number;
  priceUnit: string;
  productId?: string;
  availabilityNote?: string;
  message?: string;
}

export function RfqDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<RespondFormValues>();

  function load() {
    setLoading(true);
    apiClient
      .get<Rfq>(`/rfqs/${id}`)
      .then(({ data }) => setRfq(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    apiClient
      .get<Paginated<Product>>('/catalog', { params: { isActive: 'true', pageSize: 100 } })
      .then(({ data }) => setProducts(data.items))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleProductSelect(productId?: string) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setFieldsValue({ price: Number(product.price), priceUnit: product.unit });
    }
  }

  async function handleRespond(values: RespondFormValues) {
    setSubmitting(true);
    try {
      await apiClient.post(`/rfqs/${id}/respond`, values);
      message.success(t('rfqs.detail.form.respondSuccess'));
      load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        message.warning(t('rfqs.detail.form.conflict'));
        load();
      } else {
        message.error(t('rfqs.detail.form.respondError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDecline() {
    let reason = '';
    Modal.confirm({
      title: t('rfqs.detail.form.declineConfirm.title'),
      content: (
        <>
          <p>{t('rfqs.detail.form.declineConfirm.description')}</p>
          <Input.TextArea
            rows={2}
            placeholder={t('rfqs.detail.form.declineConfirm.reasonPlaceholder')}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </>
      ),
      okText: t('rfqs.detail.form.declineConfirm.ok'),
      cancelText: t('rfqs.detail.form.declineConfirm.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.post(`/rfqs/${id}/decline`, { reason: reason || undefined });
          message.success(t('rfqs.detail.form.declineSuccess'));
          load();
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            message.warning(t('rfqs.detail.form.conflict'));
            load();
          } else {
            message.error(t('rfqs.detail.form.declineError'));
          }
        }
      },
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !rfq) {
    return <Alert type="warning" showIcon message={t('rfqs.detail.notFound')} />;
  }

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} — ${Number(p.price).toLocaleString()} EGP / ${p.unit}` }));

  return (
    <>
      <PageHeader
        title={t('rfqs.detail.requestTitle')}
        actions={<Button onClick={() => navigate('/rfqs')}>{t('rfqs.detail.backToInbox')}</Button>}
      />

      <Card style={{ borderRadius: 14, marginBottom: 16, maxWidth: 640 }}>
        <Tag color={STATUS_COLORS[rfq.status]} style={{ marginBottom: 12 }}>
          {t(`rfqs.status.${rfq.status}`)}
        </Tag>
        <Descriptions column={1} size="small" labelStyle={{ color: palette.textTertiary }}>
          <Descriptions.Item label={t('rfqs.detail.buyer')}>{rfq.buyerName}</Descriptions.Item>
          <Descriptions.Item label={t('rfqs.detail.phone')}>{rfq.buyerPhone}</Descriptions.Item>
          <Descriptions.Item label={t('rfqs.detail.category')}>{t(`categories.${rfq.category}`)}</Descriptions.Item>
          <Descriptions.Item label={t('rfqs.detail.description')}>{rfq.description}</Descriptions.Item>
          {rfq.quantity && <Descriptions.Item label={t('rfqs.detail.quantity')}>{rfq.quantity}</Descriptions.Item>}
          <Descriptions.Item label={t('rfqs.detail.submitted')}>{new Date(rfq.createdAt).toLocaleString()}</Descriptions.Item>
          {rfq.deadlineAt && (
            <Descriptions.Item label={t('rfqs.detail.deadline')}>{new Date(rfq.deadlineAt).toLocaleString()}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={t('rfqs.detail.responseTitle')} style={{ borderRadius: 14, maxWidth: 640 }}>
        {rfq.status === 'NEW' && (
          <Form form={form} layout="vertical" onFinish={handleRespond}>
            <Form.Item name="productId" label={t('rfqs.detail.form.linkedProduct')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('rfqs.detail.form.linkedProductPlaceholder')}
                options={productOptions}
                onChange={handleProductSelect}
              />
            </Form.Item>
            <Space.Compact block>
              <Form.Item
                name="price"
                label={t('rfqs.detail.form.price')}
                rules={[{ required: true, type: 'number', min: 0.01 }]}
                style={{ width: '60%' }}
              >
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="priceUnit" label={t('rfqs.detail.form.priceUnit')} rules={[{ required: true }]} style={{ width: '40%' }}>
                <Input />
              </Form.Item>
            </Space.Compact>
            <Form.Item name="availabilityNote" label={t('rfqs.detail.form.availabilityNote')}>
              <Input placeholder={t('rfqs.detail.form.availabilityNotePlaceholder')} maxLength={300} />
            </Form.Item>
            <Form.Item name="message" label={t('rfqs.detail.form.message')}>
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t('rfqs.detail.form.sendQuote')}
              </Button>
              <Button danger onClick={handleDecline}>
                {t('rfqs.detail.form.decline')}
              </Button>
            </Space>
          </Form>
        )}

        {rfq.status === 'RESPONDED' && rfq.response && (
          <Descriptions column={1} size="small" labelStyle={{ color: palette.textTertiary }}>
            <Descriptions.Item label={t('rfqs.detail.summary.quotedPrice')}>
              {Number(rfq.response.price).toLocaleString()} EGP / {rfq.response.priceUnit}
            </Descriptions.Item>
            {rfq.response.availabilityNote && (
              <Descriptions.Item label={t('rfqs.detail.summary.availabilityNote')}>{rfq.response.availabilityNote}</Descriptions.Item>
            )}
            {rfq.response.message && (
              <Descriptions.Item label={t('rfqs.detail.summary.message')}>{rfq.response.message}</Descriptions.Item>
            )}
            <Descriptions.Item label={t('rfqs.detail.summary.respondedAt')}>
              {new Date(rfq.response.respondedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}

        {rfq.status === 'DECLINED' && (
          <Descriptions column={1} size="small" labelStyle={{ color: palette.textTertiary }}>
            <Descriptions.Item label={t('rfqs.detail.summary.declineReason')}>
              {rfq.declineReason ?? t('common.notProvided')}
            </Descriptions.Item>
            {rfq.declinedAt && (
              <Descriptions.Item label={t('rfqs.detail.summary.declinedAt')}>
                {new Date(rfq.declinedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        {rfq.status === 'EXPIRED' && (
          <Typography.Text style={{ color: palette.textTertiary }}>{t(`rfqs.status.EXPIRED`)}</Typography.Text>
        )}
      </Card>
    </>
  );
}
