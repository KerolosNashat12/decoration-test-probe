import { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Drawer, Grid, Button, Badge, type MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  FileSearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { apiClient } from '../api/client';
import type { DashboardSummary } from '../types';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard', badge: false },
  { key: 'rfqs', path: '/rfqs', icon: <FileSearchOutlined />, labelKey: 'nav.rfqs', badge: true },
  { key: 'catalog', path: '/catalog', icon: <ShopOutlined />, labelKey: 'nav.catalog', badge: false },
  { key: 'profile', path: '/profile', icon: <UserOutlined />, labelKey: 'nav.profile', badge: false },
  { key: 'settings', path: '/settings', icon: <SettingOutlined />, labelKey: 'nav.settings', badge: false },
] as const;

// Sidebar nav is grouped into labeled sections (structural pattern borrowed
// from a reference admin dashboard â grouped nav under bold uppercase
// section labels), not a flat list. Keys must all exist in NAV_ITEMS above.
const NAV_SECTIONS = [
  { labelKey: 'nav.sectionOperations', keys: ['dashboard', 'rfqs', 'catalog'] },
  { labelKey: 'nav.sectionAccount', keys: ['profile', 'settings'] },
] as const;

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 24px 8px' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${palette.primaryActive}, ${palette.primary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        D
      </div>
      <Typography.Text style={{ color: palette.textBase, fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>
        DECORATION
      </Typography.Text>
    </div>
  );
}

export function DashboardLayout() {
  const { tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newRfqCount, setNewRfqCount] = useState(0);
  const { t } = useTranslation();

  // Lightweight badge count â fetched once per route change rather than
  // polled live (SRS Â§18 only requires this to agree with the inbox's own
  // count, not to update in real time across tabs/sessions).
  useEffect(() => {
    apiClient
      .get<DashboardSummary>('/dashboard/summary')
      .then(({ data }) => setNewRfqCount(data.newRfqs))
      .catch(() => {
        /* badge is a convenience â a failed fetch just leaves it at 0 */
      });
  }, [location.pathname]);

  const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? 'dashboard';

  const userMenu: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: t('nav.signOut'), onClick: logout },
  ];

  function goTo(path: string) {
    navigate(path);
    setDrawerOpen(false);
  }

  function renderNavMenu(keys: readonly string[]) {
    const items = NAV_ITEMS.filter((item) => keys.includes(item.key));
    return (
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items.map(({ key, icon, labelKey, badge }) => ({
          key,
          icon,
          label:
            badge && newRfqCount > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {t(labelKey)}
                <Badge count={newRfqCount} size="small" />
              </span>
            ) : (
              t(labelKey)
            ),
        }))}
        onClick={({ key }) => {
          const item = NAV_ITEMS.find((i) => i.key === key);
          if (item) goTo(item.path);
        }}
        style={{ background: 'transparent', border: 'none', padding: '0 12px' }}
      />
    );
  }

  function renderSectionLabel(labelKey: string) {
    return (
      <div
        key={labelKey}
        style={{ padding: '16px 20px 4px', fontSize: 11, letterSpacing: 1, color: palette.textTertiary, fontWeight: 600 }}
      >
        {t(labelKey)}
      </div>
    );
  }

  const navSections = (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.labelKey}>
          {renderSectionLabel(section.labelKey)}
          {renderNavMenu(section.keys)}
        </div>
      ))}
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider width={240} style={{ borderRight: `1px solid ${palette.border}` }}>
          <Logo />
          {navSections}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          width={240}
          styles={{ body: { padding: 0, background: palette.bg }, content: { background: palette.bg } }}
        >
          <Logo />
          {navSections}
        </Drawer>
      )}

      <Layout>
        {/* No quick-actions row here: Dashboard.tsx's own PageHeader owns
            quick actions for the /dashboard route, keeping this layout
            header route-agnostic and avoiding overlap with that page. */}
        <Header
          style={{
            background: palette.bg,
            borderBottom: `1px solid ${palette.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            padding: '0 16px 0 12px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: palette.textBase, fontSize: 18 }} />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            />
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
            <LanguageSwitcher />
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar style={{ background: palette.primaryActive, flexShrink: 0 }}>
                  {tenant?.name?.charAt(0) ?? '?'}
                </Avatar>
                {!isMobile && (
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ color: palette.textBase, fontSize: 13, fontWeight: 600 }}>{tenant?.name}</div>
                    <div style={{ color: palette.textTertiary, fontSize: 11 }}>{tenant?.email}</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
