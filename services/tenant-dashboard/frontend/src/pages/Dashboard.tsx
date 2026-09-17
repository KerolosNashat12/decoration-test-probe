import { useEffect, useState, type ReactNode } from 'react';
import { Card, Col, Row, Spin, Table, Tag, Alert, Button, Typography } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  InboxOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { palette } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { TrendChart } from '../components/TrendChart';
import type { DashboardSummary, Rfq, RfqStatus } from '../types';

const RFQ_STATUS_COLORS: Record<RfqStatus, string> = {
  NEW: 'blue',
  RESPONDED: 'green',
  DECLINED: 'red',
  EXPIRED: 'default',
};

function StatCard({
  icon,
  label,
  value,
  accent,
  empty,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: string;
  empty?: string;
  onClick?: () => void;
}) {
  return (
    <Card style={{ borderRadius: 14, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick} hoverable={!!onClick}>
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

function AttentionRow({
  icon,
  accent,
  text,
  onClick,
  showBorder,
}: {
  icon: ReactNode;
  accent: string;
  text: string;
  onClick: () => void;
  showBorder: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: showBorder ? `1px solid ${palette.border}` : 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${accent}26`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 13, color: palette.textBase, flex: 1 }}>{text}</div>
    </div>
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

  const trendTotal = summary.rfqTrend.reduce((sum, point) => sum + point.count, 0);

  const attentionItems: { key: string; icon: ReactNode; accent: string; text: string }[] = [];
  if (summary.newRfqs > 0) {
    attentionItems.push({
      key: 'new',
      icon: <FileSearchOutlined />,
      accent: '#E4A62C',
      text: t('dashboard.attention.newRfqsLine', { count: summary.newRfqs }),
    });
  }
  if (summary.expiringSoon > 0) {
    attentionItems.push({
      key: 'expiring',
      icon: <WarningOutlined />,
      accent: '#E67E22',
      text: t('dashboard.attention.expiringSoonLine', { count: summary.expiringSoon }),
    });
  }

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/catalog/new')}>
              {t('dashboard.actions.newProduct')}
            </Button>
            <Button icon={<InboxOutlined />} onClick={() => navigate('/rfqs')}>
              {t('dashboard.actions.viewRfqInbox')}
            </Button>
          </>
        }
      />

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
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FileTextOutlined />}
            label={t('dashboard.stats.totalRfqs')}
            value={summary.totalRfqs}
            accent="#2FB8C6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CloseCircleOutlined />}
            label={t('dashboard.stats.declinedRfqs')}
            value={summary.declinedRfqs}
            accent="#D64550"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FieldTimeOutlined />}
            label={t('dashboard.stats.expiredRfqs')}
            value={summary.expiredRfqs}
            accent="#8A85A8"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            label={t('dashboard.stats.expiringSoon')}
            value={summary.expiringSoon}
            accent="#E67E22"
            onClick={() => navigate('/rfqs')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch" style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={t('dashboard.trend.title')}
            extra={
              <span style={{ fontSize: 12, color: palette.textTertiary }}>
                {t('dashboard.trend.total', { count: trendTotal })}
              </span>
            }
            style={{ borderRadius: 14, height: '100%' }}
          >
            {summary.rfqTrend.length > 0 ? (
              <TrendChart data={summary.rfqTrend} />
            ) : (
              <Typography.Text style={{ color: palette.textTertiary }}>{t('dashboard.trend.empty')}</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t('dashboard.attention.title')} style={{ borderRadius: 14, height: '100%' }}>
            {attentionItems.length > 0 ? (
              <div>
                {attentionItems.map((item, index) => (
                  <AttentionRow
                    key={item.key}
                    icon={item.icon}
                    accent={item.accent}
                    text={item.text}
                    onClick={() => navigate('/rfqs')}
                    showBorder={index < attentionItems.length - 1}
                  />
                ))}
              </div>
            ) : (
              <Typography.Text style={{ color: palette.textTertiary }}>{t('dashboard.attention.allClear')}</Typography.Text>
            )}
          </Card>
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
            {t('dashboard.stats.totalProductsEmpty')} â
          </Button>
        </Typography.Paragraph>
      )}
    </>
  );
}
