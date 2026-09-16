import { useEffect, useState } from 'react';
import { Table, Tag, Segmented, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { FileSearchOutlined } from '@ant-design/icons';
import type { Paginated, Rfq, RfqStatus } from '../../types';

type StatusFilter = 'all' | RfqStatus;

const STATUS_COLORS: Record<RfqStatus, string> = {
  NEW: 'blue',
  RESPONDED: 'green',
  DECLINED: 'red',
  EXPIRED: 'default',
};

export function RfqInboxPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState<Rfq[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => setPage(1), [status]);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<Paginated<Rfq>>('/rfqs', { params: { status: status === 'all' ? undefined : status, page, pageSize } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <>
      <PageHeader title={t('rfqs.title')} subtitle={t('rfqs.subtitle')} />

      <Segmented
        value={status}
        onChange={(v) => setStatus(v as StatusFilter)}
        style={{ marginBottom: 16 }}
        options={[
          { label: t('rfqs.filterStatus.all'), value: 'all' },
          { label: t('rfqs.filterStatus.new'), value: 'NEW' },
          { label: t('rfqs.filterStatus.responded'), value: 'RESPONDED' },
          { label: t('rfqs.filterStatus.declined'), value: 'DECLINED' },
          { label: t('rfqs.filterStatus.expired'), value: 'EXPIRED' },
        ]}
      />

      <Table<Rfq>
        rowKey="id"
        loading={loading}
        dataSource={items}
        scroll={{ x: 700 }}
        pagination={{ current: page, pageSize, total, onChange: setPage, showSizeChanger: false }}
        onRow={(record) => ({
          onClick: () => navigate(`/rfqs/${record.id}`),
          style: { cursor: 'pointer', fontWeight: record.status === 'NEW' ? 600 : 400 },
        })}
        locale={{
          emptyText:
            total === 0 && status === 'all' ? (
              <EmptyState icon={<FileSearchOutlined />} title={t('rfqs.empty.title')} description={t('rfqs.empty.description')} />
            ) : (
              <EmptyState
                icon={<FileSearchOutlined />}
                title={t('rfqs.emptyFiltered.title')}
                description={
                  <Typography.Link onClick={() => setStatus('all')}>{t('rfqs.emptyFiltered.clearLink')}</Typography.Link>
                }
              />
            ),
        }}
        columns={[
          {
            title: t('rfqs.columns.buyer'),
            dataIndex: 'buyerName',
            render: (name: string, record) => (
              <>
                {name}
                {record.isTest && (
                  <Tag color="purple" style={{ marginInlineStart: 8 }}>
                    {t('rfqs.testTag')}
                  </Tag>
                )}
              </>
            ),
          },
          {
            title: t('rfqs.columns.category'),
            dataIndex: 'category',
            render: (v: Rfq['category']) => <Tag>{t(`categories.${v}`)}</Tag>,
          },
          {
            title: t('rfqs.columns.description'),
            dataIndex: 'description',
            ellipsis: true,
          },
          {
            title: t('rfqs.columns.submitted'),
            dataIndex: 'createdAt',
            render: (v: string) => new Date(v).toLocaleDateString(),
          },
          {
            title: t('rfqs.columns.status'),
            dataIndex: 'status',
            render: (v: RfqStatus) => <Tag color={STATUS_COLORS[v]}>{t(`rfqs.status.${v}`)}</Tag>,
          },
        ]}
      />
    </>
  );
}
