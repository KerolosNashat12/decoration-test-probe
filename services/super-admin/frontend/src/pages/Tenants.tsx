import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  ShopOutlined,
  KeyOutlined,
  CopyOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { CredentialsModal } from '../components/CredentialsModal';
import {
  TENANT_CATEGORY_LABELS,
  type AppConfig,
  type ProvisioningResult,
  type Tenant,
  type TenantCategory,
  type TenantStatus,
} from '../types';

const STATUS_COLORS: Record<Tenant['status'], string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'default',
};

const ALL_CATEGORIES = Object.keys(TENANT_CATEGORY_LABELS) as TenantCategory[];
const ALL_STATUSES: TenantStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export function TenantsPage() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TenantCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<TenantStatus[]>([]);

  const [selected, setSelected] = useState<Tenant | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [credentials, setCredentials] = useState<ProvisioningResult | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const categoryOptions = ALL_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }));
  const statusOptions = ALL_STATUSES.map((value) => ({ value, label: t(`tenants.statusOptions.${value}`) }));

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Tenant[]>('/tenants');
      setTenants(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Best-effort: the login-link field just falls back to "not
    // configured" if this fails, so it never blocks the tenants list.
    apiClient
      .get<AppConfig>('/config')
      .then(({ data }) => setConfig(data))
      .catch(() => setConfig({ tenantDashboardUrl: null }));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (q) {
        const haystack = `${tenant.name} ${tenant.contactName} ${tenant.phone} ${tenant.district ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (categoryFilter.length > 0 && !tenant.categories.some((c) => categoryFilter.includes(c))) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(tenant.status)) return false;
      return true;
    });
  }, [tenants, search, categoryFilter, statusFilter]);

  async function handleCreate(values: {
    name: string;
    contactName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    district?: string;
    categories: TenantCategory[];
  }) {
    try {
      await apiClient.post('/tenants', values);
      message.success(t('tenants.createSuccess', { name: values.name }));
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch {
      message.error(t('tenants.createError'));
    }
  }

  async function toggleSuspend(tenant: Tenant) {
    try {
      await apiClient.patch(`/tenants/${tenant.id}/${tenant.status === 'SUSPENDED' ? 'reactivate' : 'suspend'}`);
      message.success(
        tenant.status === 'SUSPENDED'
          ? t('tenants.reactivateSuccess', { name: tenant.name })
          : t('tenants.suspendSuccess', { name: tenant.name }),
      );
      load();
      if (selected?.id === tenant.id) {
        const { data } = await apiClient.get<Tenant>(`/tenants/${tenant.id}`);
        setSelected(data);
      }
    } catch {
      message.error(t('tenants.statusUpdateError'));
    }
  }

  async function handleProvisionDashboard(tenant: Tenant) {
    setProvisioning(true);
    try {
      const { data } = await apiClient.patch<ProvisioningResult>(`/tenants/${tenant.id}/provision-dashboard`);
      setCredentials(data);
      message.success(t('tenants.provisionSuccess'));
      load();
      const { data: fresh } = await apiClient.get<Tenant>(`/tenants/${tenant.id}`);
      setSelected(fresh);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('tenants.provisionError'));
    } finally {
      setProvisioning(false);
    }
  }

  function openDetail(tenant: Tenant) {
    setSelected(tenant);
    setEditing(false);
    editForm.setFieldsValue(tenant);
  }

  async function handleSaveEdit(values: {
    name: string;
    contactName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    district?: string;
    categories: TenantCategory[];
    notes?: string;
  }) {
    if (!selected) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch<Tenant>(`/tenants/${selected.id}`, values);
      message.success(t('tenants.updateSuccess'));
      setSelected(data);
      setEditing(false);
      load();
    } catch {
      message.error(t('tenants.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('tenants.title')}
        subtitle={t('tenants.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('tenants.addTenant')}
          </Button>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Input
          allowClear
          placeholder={t('tenants.searchPlaceholder')}
          prefix={<SearchOutlined style={{ color: palette.textTertiary }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder={t('tenants.categoryFilterPlaceholder')}
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ minWidth: 220 }}
          maxTagCount="responsive"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder={t('tenants.statusFilterPlaceholder')}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        locale={{
          emptyText: (
            <EmptyState
              icon={<ShopOutlined />}
              title={tenants.length === 0 ? t('tenants.emptyTitleNoData') : t('tenants.emptyTitleFiltered')}
              description={tenants.length === 0 ? t('tenants.emptyDescriptionNoData') : t('tenants.emptyDescriptionFiltered')}
            />
          ),
        }}
        columns={[
          { title: t('tenants.columns.name'), dataIndex: 'name' },
          { title: t('tenants.columns.contact'), dataIndex: 'contactName' },
          { title: t('tenants.columns.phone'), dataIndex: 'phone' },
          { title: t('tenants.columns.district'), dataIndex: 'district', render: (v) => v ?? t('common.notProvided') },
          {
            title: t('tenants.columns.categories'),
            dataIndex: 'categories',
            render: (categories: Tenant['categories']) => (
              <>
                {categories.map((c) => (
                  <Tag key={c}>{t(`categories.${c}`)}</Tag>
                ))}
              </>
            ),
          },
          {
            title: t('tenants.columns.status'),
            dataIndex: 'status',
            render: (status: Tenant['status']) => <Tag color={STATUS_COLORS[status]}>{t(`tenants.statusOptions.${status}`)}</Tag>,
          },
          {
            title: t('tenants.columns.actions'),
            render: (_, record) => (
              <Popconfirm
                title={record.status === 'SUSPENDED' ? t('tenants.reactivateConfirm') : t('tenants.suspendConfirm')}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  toggleSuspend(record);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Button
                  size="small"
                  icon={record.status === 'SUSPENDED' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  danger={record.status !== 'SUSPENDED'}
                  onClick={(e) => e.stopPropagation()}
                >
                  {record.status === 'SUSPENDED' ? t('tenants.reactivate') : t('tenants.suspend')}
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal
        title={t('tenants.addModalTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText={t('tenants.addTenant')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label={t('tenants.form.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label={t('tenants.form.contactName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('tenants.form.phone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label={t('tenants.form.whatsapp')}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('tenants.form.email')}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="district" label={t('tenants.form.district')}>
            <Input placeholder={t('tenants.form.districtPlaceholder')} />
          </Form.Item>
          <Form.Item name="categories" label={t('tenants.form.categories')} rules={[{ required: true }]}>
            <Select mode="multiple" options={categoryOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={selected?.name}
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setEditing(false);
        }}
        width={440}
        extra={
          selected && !editing ? (
            <Button size="small" onClick={() => setEditing(true)}>
              {t('common.edit')}
            </Button>
          ) : undefined
        }
      >
        {selected && !editing && (
          <>
            <Tag color={STATUS_COLORS[selected.status]}>{t(`tenants.statusOptions.${selected.status}`)}</Tag>
            <Divider />
            <Descriptions column={1} size="small" labelStyle={{ color: palette.textTertiary }}>
              <Descriptions.Item label={t('tenants.drawer.contact')}>{selected.contactName}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.phone')}>{selected.phone}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.whatsapp')}>{selected.whatsapp ?? t('common.notProvided')}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.email')}>{selected.email ?? t('common.notProvided')}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.district')}>{selected.district ?? t('common.notProvided')}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.categories')}>
                {selected.categories.map((c) => (
                  <Tag key={c}>{t(`categories.${c}`)}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.notes')}>{selected.notes ?? t('common.notProvided')}</Descriptions.Item>
              <Descriptions.Item label={t('tenants.drawer.dashboardAccess')}>
                {selected.dashboardUserEmail ? (
                  <Tag color="blue">{selected.dashboardUserEmail}</Tag>
                ) : (
                  <Tag>{t('tenants.drawer.notProvisioned')}</Tag>
                )}
              </Descriptions.Item>
              {selected.dashboardUserEmail && (
                <Descriptions.Item label={t('tenants.drawer.dashboardLoginLink')}>
                  {config?.tenantDashboardUrl ? (
                    <Space size={6}>
                      <Typography.Link href={`${config.tenantDashboardUrl}/login`} target="_blank" rel="noreferrer">
                        <LinkOutlined /> {config.tenantDashboardUrl}
                      </Typography.Link>
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(`${config.tenantDashboardUrl}/login`);
                          message.success(t('tenants.drawer.linkCopied'));
                        }}
                      />
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">{t('tenants.drawer.dashboardLoginLinkUnset')}</Typography.Text>
                  )}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('tenants.drawer.added')}>{new Date(selected.createdAt).toLocaleString()}</Descriptions.Item>
              {selected.reviewedAt && (
                <Descriptions.Item label={t('tenants.drawer.reviewed')}>
                  {new Date(selected.reviewedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            {!selected.dashboardUserEmail && (
              <>
                {selected.email ? (
                  <Button
                    icon={<KeyOutlined />}
                    block
                    style={{ marginBottom: 12 }}
                    loading={provisioning}
                    onClick={() => handleProvisionDashboard(selected)}
                  >
                    {t('tenants.drawer.provisionButton')}
                  </Button>
                ) : (
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {t('tenants.drawer.provisionHint')}
                  </Typography.Text>
                )}
              </>
            )}

            <Divider />
            <Popconfirm
              title={selected.status === 'SUSPENDED' ? t('tenants.reactivateConfirm') : t('tenants.suspendConfirm')}
              onConfirm={() => toggleSuspend(selected)}
            >
              <Button
                icon={selected.status === 'SUSPENDED' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                danger={selected.status !== 'SUSPENDED'}
                block
              >
                {selected.status === 'SUSPENDED' ? t('tenants.reactivateTenant') : t('tenants.suspendTenant')}
              </Button>
            </Popconfirm>
          </>
        )}

        {selected && editing && (
          <Form form={editForm} layout="vertical" onFinish={handleSaveEdit} initialValues={selected}>
            <Form.Item name="name" label={t('tenants.form.name')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="contactName" label={t('tenants.form.contactName')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={t('tenants.form.phone')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="whatsapp" label={t('tenants.form.whatsapp')}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label={t('tenants.form.email')}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="district" label={t('tenants.form.district')}>
              <Input />
            </Form.Item>
            <Form.Item name="categories" label={t('tenants.form.categories')} rules={[{ required: true }]}>
              <Select mode="multiple" options={categoryOptions} />
            </Form.Item>
            <Form.Item name="notes" label={t('tenants.form.notes')}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('common.saveChanges')}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  editForm.setFieldsValue(selected);
                }}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form>
        )}
      </Drawer>

      <CredentialsModal open={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
