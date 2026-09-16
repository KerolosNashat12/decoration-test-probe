import { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Spin, Tag, Table, Progress } from 'antd';
import {
  ShopOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { TENANT_CATEGORY_LABELS, type DashboardStats, type TenantApplication } from '../types';

const STATUS_COLORS: Record<TenantApplication['status'], string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card style={{ borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${accent}26`,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: palette.textBase, lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: 13, color: palette.textTertiary }}>{label}</div>
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<DashboardStats>('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const categoryEntries = Object.entries(stats.categoryCounts) as [keyof typeof TENANT_CATEGORY_LABELS, number][];
  const maxCategoryCount = Math.max(1, ...categoryEntries.map(([, count]) => count));

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<ShopOutlined />} label={t('dashboard.totalTenants')} value={stats.totalTenants} accent={palette.primaryActive} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<CheckCircleOutlined />} label={t('dashboard.approvedTenants')} value={stats.approvedTenants} accent="#3BB273" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<FileSearchOutlined />} label={t('dashboard.pendingApplications')} value={stats.pendingApplications} accent="#E4A62C" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<PauseCircleOutlined />} label={t('dashboard.suspendedTenants')} value={stats.suspendedTenants} accent="#E4542C" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title={t('dashboard.tenantsByCategory')} style={{ borderRadius: 14, height: '100%' }}>
            {categoryEntries.length === 0 && (
              <Typography.Text style={{ color: palette.textTertiary }}>{t('dashboard.noApprovedTenants')}</Typography.Text>
            )}
            {categoryEntries.map(([category, count]) => (
              <div key={category} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Typography.Text style={{ color: palette.textSecondary, fontSize: 13 }}>
                    {t(`categories.${category}`)}
                  </Typography.Text>
                  <Typography.Text style={{ color: palette.textBase, fontSize: 13, fontWeight: 600 }}>{count}</Typography.Text>
                </div>
                <Progress
                  percent={(count / maxCategoryCount) * 100}
                  showInfo={false}
                  strokeColor={palette.primaryActive}
                  trailColor="rgba(255,255,255,0.06)"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={t('dashboard.recentApplications')} style={{ borderRadius: 14, height: '100%' }}>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              scroll={{ x: 500 }}
              dataSource={stats.recentApplications}
              columns={[
                { title: t('dashboard.shop'), dataIndex: 'shopName' },
                { title: t('dashboard.district'), dataIndex: 'district', render: (v) => v ?? t('common.notProvided') },
                {
                  title: t('common.status'),
                  dataIndex: 'status',
                  render: (status: TenantApplication['status']) => (
                    <Tag color={STATUS_COLORS[status]}>{t(`tenants.statusOptions.${status}`)}</Tag>
                  ),
                },
                {
                  title: t('dashboard.submitted'),
                  dataIndex: 'submittedAt',
                  render: (v: string) => new Date(v).toLocaleDateString(),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
