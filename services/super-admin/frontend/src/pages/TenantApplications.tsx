import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Modal, Input, message, Select } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import { TENANT_CATEGORY_LABELS, type TenantApplication } from '../types';

const STATUS_COLORS: Record<TenantApplication['status'], string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function TenantApplicationsPage() {
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TenantApplication['status'] | undefined>('PENDING');
  const [rejecting, setRejecting] = useState<TenantApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<TenantApplication[]>('/tenant-applications', {
        params: statusFilter ? { status: statusFilter } : undefined,
      });
      setApplications(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleApprove(application: TenantApplication) {
    try {
      await apiClient.patch(`/tenant-applications/${application.id}/approve`);
      message.success(`${application.shopName} approved — tenant created`);
      load();
    } catch {
      message.error('Could not approve this application.');
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    try {
      await apiClient.patch(`/tenant-applications/${rejecting.id}/reject`, { reason: rejectReason || undefined });
      message.success(`${rejecting.shopName} rejected`);
      setRejecting(null);
      setRejectReason('');
      load();
    } catch {
      message.error('Could not reject this application.');
    }
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Tenant Applications
        </Typography.Title>
        <Select
          value={statusFilter}
          style={{ width: 180 }}
          onChange={setStatusFilter}
          options={[
            { value: 'PENDING', label: 'Pending review' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: undefined, label: 'All' },
          ]}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={applications}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Shop', dataIndex: 'shopName' },
          { title: 'Contact', dataIndex: 'contactName' },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'District', dataIndex: 'district', render: (v) => v ?? '—' },
          {
            title: 'Categories',
            dataIndex: 'categories',
            render: (categories: TenantApplication['categories']) => (
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
            render: (status: TenantApplication['status']) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
          },
          {
            title: 'Submitted',
            dataIndex: 'submittedAt',
            render: (v: string) => new Date(v).toLocaleDateString(),
          },
          {
            title: 'Actions',
            render: (_, record) =>
              record.status === 'PENDING' ? (
                <Space>
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                    Approve
                  </Button>
                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejecting(record)}>
                    Reject
                  </Button>
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  {record.status === 'REJECTED' && record.rejectionReason ? record.rejectionReason : '—'}
                </Typography.Text>
              ),
          },
        ]}
      />

      <Modal
        title={`Reject ${rejecting?.shopName ?? ''}`}
        open={!!rejecting}
        onOk={handleReject}
        onCancel={() => {
          setRejecting(null);
          setRejectReason('');
        }}
        okText="Reject application"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          placeholder="Reason (optional, kept internally)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
