import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, Segmented, Switch, Popconfirm, Avatar, message } from 'antd';
import { PlusOutlined, SearchOutlined, ShopOutlined, PictureOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { palette } from '../../theme';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { ALL_TENANT_CATEGORIES, type Paginated, type Product, type TenantCategory } from '../../types';

type StatusFilter = 'all' | 'active' | 'inactive';

export function CatalogListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<TenantCategory | undefined>(undefined);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const categoryOptions = ALL_TENANT_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }));
  const hasFilters = !!debouncedSearch || !!category || status !== 'all';

  // SRS §9: 300ms debounce on the search box, filters otherwise apply
  // immediately.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Paginated<Product>>('/catalog', {
        params: {
          search: debouncedSearch || undefined,
          category,
          isActive: status === 'all' ? undefined : status === 'active' ? 'true' : 'false',
          page,
          pageSize,
        },
      });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, status, page]);

  async function toggleActive(product: Product, isActive: boolean) {
    const previous = items;
    setItems((current) => current.map((p) => (p.id === product.id ? { ...p, isActive } : p)));
    try {
      await apiClient.patch(`/catalog/${product.id}`, { isActive });
    } catch {
      setItems(previous);
      message.error(t('catalog.toggleError'));
    }
  }

  async function handleDelete(product: Product) {
    try {
      await apiClient.delete(`/catalog/${product.id}`);
      message.success(t('catalog.deleteSuccess'));
      load();
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(apiMessage ?? t('catalog.deleteBlocked'));
    }
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setCategory(undefined);
    setStatus('all');
  }

  return (
    <>
      <PageHeader
        title={t('catalog.title')}
        subtitle={t('catalog.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/catalog/new')}>
            {t('catalog.addProduct')}
          </Button>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Input
          allowClear
          placeholder={t('catalog.searchPlaceholder')}
          prefix={<SearchOutlined style={{ color: palette.textTertiary }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder={t('catalog.filterCategory')}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          style={{ minWidth: 200 }}
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { label: t('catalog.filterStatus.all'), value: 'all' },
            { label: t('catalog.filterStatus.active'), value: 'active' },
            { label: t('catalog.filterStatus.inactive'), value: 'inactive' },
          ]}
        />
      </Space>

      <Table<Product>
        rowKey="id"
        loading={loading}
        dataSource={items}
        scroll={{ x: 700 }}
        pagination={{ current: page, pageSize, total, onChange: setPage, showSizeChanger: false }}
        onRow={(record) => ({ onClick: () => navigate(`/catalog/${record.id}/edit`), style: { cursor: 'pointer' } })}
        locale={{
          emptyText:
            total === 0 && !hasFilters ? (
              <EmptyState icon={<ShopOutlined />} title={t('catalog.empty.title')} description={t('catalog.empty.description')} />
            ) : (
              <EmptyState
                icon={<ShopOutlined />}
                title={t('catalog.emptyFiltered.title')}
                description={
                  <Button type="link" onClick={clearFilters} style={{ padding: 0 }}>
                    {t('catalog.emptyFiltered.clear')}
                  </Button>
                }
              />
            ),
        }}
        columns={[
          {
            title: '',
            dataIndex: 'photoUrl',
            width: 56,
            render: (photoUrl: string | null) =>
              photoUrl ? <Avatar shape="square" src={photoUrl} /> : <Avatar shape="square" icon={<PictureOutlined />} />,
          },
          { title: t('catalog.columns.name'), dataIndex: 'name' },
          {
            title: t('catalog.columns.category'),
            dataIndex: 'category',
            render: (v: TenantCategory) => <Tag>{t(`categories.${v}`)}</Tag>,
          },
          {
            title: t('catalog.columns.price'),
            dataIndex: 'price',
            render: (price: string, record) => `${Number(price).toLocaleString()} EGP / ${record.unit}`,
          },
          {
            title: t('catalog.columns.status'),
            dataIndex: 'isActive',
            render: (isActive: boolean, record) => (
              <Switch
                checked={isActive}
                onClick={(_checked, e) => e.stopPropagation()}
                onChange={(checked) => toggleActive(record, checked)}
              />
            ),
          },
          {
            title: t('catalog.columns.actions'),
            render: (_, record) => (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/catalog/${record.id}/edit`)}
                  aria-label={t('common.edit')}
                />
                <Popconfirm
                  title={t('catalog.deleteConfirm.title', { name: record.name })}
                  description={t('catalog.deleteConfirm.description')}
                  okText={t('catalog.deleteConfirm.ok')}
                  cancelText={t('catalog.deleteConfirm.cancel')}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
