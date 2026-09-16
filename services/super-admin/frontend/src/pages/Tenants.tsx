import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import { TENANT_CATEGORY_LABELS, type Tenant, type TenantCategory } from '../types';

const STATUS_COLORS: Record<Tenant['status'], string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'default',
};

const CATEGORY_OPTIONS = (Object.entries(TENANT_CATEGORY_LABELS) as [TenantCategory, string][]).map(
  ([value, label]) => ({ value, label }),
);

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

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
  }, []);

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
      message.success(`${values.name} added`);
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch {
      message.error('Could not create this tenant.');
    }
  }

  async function toggleSuspend(tenant: Tenant) {
    try {
      await apiClient.patch(`/tenants/${tenant.id}/${tenant.status === 'SUSPENDED' ? 'reactivate' : 'suspend'}`);
      load();
    } catch {
      message.error('Could not update this tenant.');
    }
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Tenants
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add tenant
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={tenants}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Contact', dataIndex: 'contactName' },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'District', dataIndex: 'district', render: (v) => v ?? '—' },
          {
            title: 'Categories',
            dataIndex: 'categories',
            render: (categories: Tenant['categories']) => (
              <>
                {categories.map((c) => (
                  <Tag key={c}>{TENANT_CATEGORY_LABELS[c]}</Tag>
                ))}
              </>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (status: Tenant['status']) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Popconfirm
                title={record.status === 'SUSPENDED' ? 'Reactivate this tenant?' : 'Suspend this tenant?'}
                onConfirm={() => toggleSuspend(record)}
              >
                <Button
                  size="small"
                  icon={record.status === 'SUSPENDED' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  danger={record.status !== 'SUSPENDED'}
                >
                  {record.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal
        title="Add a tenant directly"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="Add tenant"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Shop / business name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Contact name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp (optional)">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email (optional)">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="district" label="District (optional)">
            <Input placeholder="e.g. El Bostan, Ataba, Gomhoreya Street" />
          </Form.Item>
          <Form.Item name="categories" label="Categories" rules={[{ required: true }]}>
            <Select mode="multiple" options={CATEGORY_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
