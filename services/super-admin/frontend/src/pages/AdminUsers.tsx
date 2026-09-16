import { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Switch, message } from 'antd';
import { PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import type { AdminUser } from '../types';

const ALL_ROLES: AdminUser['role'][] = ['SUPER_ADMIN', 'REVIEWER'];

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { admin: me } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const roleOptions = ALL_ROLES.map((value) => ({ value, label: t(`adminUsers.roleOptions.${value}`) }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => `${a.name} ${a.email}`.toLowerCase().includes(q));
  }, [admins, search]);

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
      message.success(t('adminUsers.createSuccess', { name: values.name }));
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('adminUsers.createError'));
    }
  }

  async function toggleActive(target: AdminUser) {
    try {
      await apiClient.patch(`/admin-users/${target.id}`, { isActive: !target.isActive });
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('adminUsers.updateError'));
    }
  }

  async function changeRole(target: AdminUser, role: 'SUPER_ADMIN' | 'REVIEWER') {
    try {
      await apiClient.patch(`/admin-users/${target.id}`, { role });
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? t('adminUsers.updateError'));
    }
  }

  return (
    <>
      <PageHeader
        title={t('adminUsers.title')}
        subtitle={t('adminUsers.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('adminUsers.addAdmin')}
          </Button>
        }
      />

      <Input
        allowClear
        placeholder={t('adminUsers.searchPlaceholder')}
        prefix={<SearchOutlined style={{ color: palette.textTertiary }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<TeamOutlined />}
              title={admins.length === 0 ? t('adminUsers.emptyTitleNoData') : t('adminUsers.emptyTitleFiltered')}
              description={admins.length === 0 ? t('adminUsers.emptyDescriptionNoData') : t('adminUsers.emptyDescriptionFiltered')}
            />
          ),
        }}
        columns={[
          { title: t('adminUsers.columns.name'), dataIndex: 'name' },
          { title: t('adminUsers.columns.email'), dataIndex: 'email' },
          {
            title: t('adminUsers.columns.role'),
            dataIndex: 'role',
            render: (role: AdminUser['role'], record) => (
              <Select
                size="small"
                value={role}
                options={roleOptions}
                disabled={record.id === me?.id}
                style={{ width: 150 }}
                onChange={(value) => changeRole(record, value)}
              />
            ),
          },
          {
            title: t('adminUsers.columns.status'),
            dataIndex: 'isActive',
            render: (isActive: boolean) => (
              <Tag color={isActive ? 'green' : 'default'}>{isActive ? t('adminUsers.active') : t('adminUsers.deactivated')}</Tag>
            ),
          },
          {
            title: t('adminUsers.columns.lastLogin'),
            dataIndex: 'lastLoginAt',
            render: (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : t('common.never')),
          },
          {
            title: t('adminUsers.columns.actions'),
            render: (_, record) => (
              <Switch
                checked={record.isActive}
                disabled={record.id === me?.id}
                onChange={() => toggleActive(record)}
                checkedChildren={t('adminUsers.active')}
                unCheckedChildren={t('adminUsers.off')}
              />
            ),
          },
        ]}
      />

      <Modal
        title={t('adminUsers.addModalTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText={t('adminUsers.addAdmin')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label={t('adminUsers.form.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('adminUsers.form.email')} rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={t('adminUsers.form.password')} rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label={t('adminUsers.form.role')} rules={[{ required: true }]} initialValue="REVIEWER">
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
