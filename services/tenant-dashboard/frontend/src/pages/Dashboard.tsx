import { useEffect, useState, type ReactNode } from 'react';
import { Card, Col, Row, Spin, Table, Tag, Alert, Button, Typography } from 'antd';
import { ShopOutlined, CheckCircleOutlined, FileSearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';
import type { DashboardSummary, Rfq, RfqStatus } from '../types';

const RFQ_STATUS_COLORS: Record<RfqStatus, string> = {
  NEW: 'blue',
  RESPONDED: 'green',
  DECLINED: 'red',
  EXPIRED: 'default',
};

function StatCard({ icon, label, value, accent, empty }: { icon: ReactNode; label: string; value: number; accent: string; empty?: string }) {
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
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: palette.textBase, lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: 13, color: palette.textTertiary }}>{label}</div>
          {value === 0 && empty && (
            <div style={{ fontSize: 12, color: palette.textTertiary, marginTop: 2 }}>{empty}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    apiClient
      .get<DashboardSummary>('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Alert
        type="error"
        showIcon
        message={t('common.loadError')}
        action={
          <Button size="small" onClick={load}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ShopOutlined />}
            label={t('dashboard.stats.totalProducts')}
            value={summary.totalProducts}
            accent={palette.primaryActive}
            empty={t('dashboard.stats.totalProductsEmpty')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label={t('dashboard.stats.activeProducts')}
            value={summary.activeProducts}
            accent="#3BB273"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FileSearchOutlined />}
            label={t('dashboard.stats.newRfqs')}
            value={summary.newRfqs}
            accent="#E4A62C"
            empty={t('dashboard.stats.newRfqsEmpty')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ClockCircleOutlined />}
            label={t('dashboard.stats.respondedThisMonth')}
            value={summary.respondedThisMonth}
            accent="#264CC8"
          />
        </Col>
      </Row>

      <Card title={t('dashboard.recentRfqs.title')} style={{ borderRadius: 14, marginTop: 16 }}>
        <Table<Rfq>
          size="small"
          rowKey="id"
          pagination={false}
          scroll={{ x: 500 }}
          dataSource={summary.recentRfqs}
          locale={{ emptyText: t('dashboard.recentRfqs.empty') }}
          onRow={(record) => ({ onClick: () => navigate(`/rfqs/${record.id}`), style: { cursor: 'pointer' } })}
          columns={[
            { title: t('dashboard.recentRfqs.buyer'), dataIndex: 'buyerName' },
            {
              title: t('dashboard.recentRfqs.category'),
              dataIndex: 'category',
              render: (v: Rfq['category']) => t(`categories.${v}`),
            },
            {
              title: t('dashboard.recentRfqs.submitted'),
              dataIndex: 'createdAt',
              render: (v: string) => new Date(v).toLocaleDateString(),
            },
            {
              title: t('dashboard.recentRfqs.status'),
              dataIndex: 'status',
              render: (status: RfqStatus) => <Tag color={RFQ_STATUS_COLORS[status]}>{t(`rfqs.status.${status}`)}</Tag>,
            },
          ]}
        />
      </Card>

      {summary.totalProducts === 0 && (
        <Typography.Paragraph style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate('/catalog/new')} style={{ padding: 0 }}>
            {t('dashboard.stats.totalProductsEmpty')} →
          </Button>
        </Typography.Paragraph>
      )}
    </>
  );
}
