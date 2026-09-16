import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Modal, Input, message, Select } from 'antd';
import { CheckOutlined, CloseOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { CredentialsModal } from '../components/CredentialsModal';
import type { ProvisioningResult, TenantApplication } from '../types';

const STATUS_COLORS: Record<TenantApplication['status'], string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function TenantApplicationsPage() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TenantApplication['status'] | undefined>('PENDING');
  const [rejecting, setRejecting] = useState<TenantApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [credentials, setCredentials] = useState<ProvisioningResult | null>(null);

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
      const { data } = await apiClient.patch(`/tenant-applications/${application.id}/approve`);
      if (data.provisioning) {
        message.success(t('applications.approveSuccessProvisioned', { shopName: application.shopName }));
        setCredentials(data.provisioning);
      } else {
        message.success(t('applications.approveSuccessNoProvision', { shopName: application.shopName }));
      }
      load();
    } catch {
      message.error(t('applications.approveError'));
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    try {
      await apiClient.patch(`/tenant-applications/${rejecting.id}/reject`, { reason: rejectReason || undefined });
      message.success(t('applications.rejectSuccess', { shopName: rejecting.shopName }));
      setRejecting(null);
      setRejectReason('');
      load();
    } catch {
      message.error(t('applications.rejectError'));
    }
  }

  return (
    <>
      <PageHeader
        title={t('applications.title')}
        subtitle={t('applications.subtitle')}
        actions={
          <Select
            value={statusFilter}
            style={{ width: 180 }}
            onChange={setStatusFilter}
            options={[
              { value: 'PENDING', label: t('applications.filter.pending') },
              { value: 'APPROVED', label: t('applications.filter.approved') },
              { value: 'REJECTED', label: t('applications.filter.rejected') },
              { value: undefined, label: t('applications.filter.all') },
            ]}
          />
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={applications}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<FileSearchOutlined />}
              title={t('applications.emptyTitle')}
              description={
                statusFilter
                  ? t('applications.emptyDescriptionFiltered', { status: t(`applications.filter.${statusFilter.toLowerCase()}`) })
                  : t('applications.emptyDescriptionDefault')
              }
            />
          ),
        }}
        columns={[
          { title: t('applications.columns.shop'), dataIndex: 'shopName' },
          { title: t('applications.columns.contact'), dataIndex: 'contactName' },
          { title: t('applications.columns.phone'), dataIndex: 'phone' },
          { title: t('applications.columns.district'), dataIndex: 'district', render: (v) => v ?? t('common.notProvided') },
          {
            title: t('applications.columns.categories'),
            dataIndex: 'categories',
            render: (categories: TenantApplication['categories']) => (
              <>
                {categories.map((c) => (
                  <Tag key={c}>{t(`categories.${c}`)}</Tag>
                ))}
              </>
            ),
          },
          {
            title: t('applications.columns.status'),
            dataIndex: 'status',
            render: (status: TenantApplication['status']) => (
              <Tag color={STATUS_COLORS[status]}>{t(`tenants.statusOptions.${status}`)}</Tag>
            ),
          },
          {
            title: t('applications.columns.submitted'),
            dataIndex: 'submittedAt',
            render: (v: string) => new Date(v).toLocaleDateString(),
          },
          {
            title: t('applications.columns.actions'),
            render: (_, record) =>
              record.status === 'PENDING' ? (
                <Space>
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                    {t('applications.approve')}
                  </Button>
                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejecting(record)}>
                    {t('applications.reject')}
                  </Button>
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  {record.status === 'REJECTED' && record.rejectionReason ? record.rejectionReason : t('common.notProvided')}
                </Typography.Text>
              ),
          },
        ]}
      />

      <Modal
        title={t('applications.rejectModalTitle', { shopName: rejecting?.shopName ?? '' })}
        open={!!rejecting}
        onOk={handleReject}
        onCancel={() => {
          setRejecting(null);
          setRejectReason('');
        }}
        okText={t('applications.rejectConfirmButton')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          placeholder={t('applications.rejectReasonPlaceholder')}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <CredentialsModal open={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
