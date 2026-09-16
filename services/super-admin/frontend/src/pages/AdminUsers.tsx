import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, Switch, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AdminUser } from '../types';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'REVIEWER', label: 'Reviewer' },
];

export function AdminUsersPage() {
  const { admin: me } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<AdminUser[]>('/admin-users');
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(values: { name: string; email: string; password: string; role: 'SUPER_ADMIN' | 'REVIEWER' }) {
    try {
      await apiClient.post('/admin-users', values);
      message.success(`${values.name} added`);
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Could not create this admin.');
    }
  }

  async function toggleActive(target: AdminUser) {
    try {
      await apiClient.patch(`/admin-users/${target.id}`, { isActive: !target.isActive });
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Could not update this admin.');
    }
  }

  async function changeRole(target: AdminUser, role: 'SUPER_ADMIN' | 'REVIEWER') {
    try {
      await apiClient.patch(`/admin-users/${target.id}`, { role });
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Could not update this admin.');
    }
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Admin Users
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add admin
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={admins}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          {
            title: 'Role',
            dataIndex: 'role',
            render: (role: AdminUser['role'], record) => (
              <Select
                size="small"
                value={role}
                options={ROLE_OPTIONS}
                disabled={record.id === me?.id}
                style={{ width: 150 }}
                onChange={(value) => changeRole(record, value)}
              />
            ),
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Deactivated'}</Tag>,
          },
          {
            title: 'Last login',
            dataIndex: 'lastLoginAt',
            render: (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : 'Never'),
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Switch
                checked={record.isActive}
                disabled={record.id === me?.id}
                onChange={() => toggleActive(record)}
                checkedChildren="Active"
                unCheckedChildren="Off"
              />
            ),
          },
        ]}
      />

      <Modal
        title="Add an admin user"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="Add admin"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Temporary password" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="REVIEWER">
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
