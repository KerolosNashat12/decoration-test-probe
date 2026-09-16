import { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Drawer, Grid, Button, Tag, type MenuProps } from 'antd';
import { UserOutlined, ShopOutlined, FileSearchOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS = [
  { key: 'profile', path: '/profile', icon: <UserOutlined />, labelKey: 'nav.profile', disabled: false },
  { key: 'catalog', path: '/catalog', icon: <ShopOutlined />, labelKey: 'nav.catalog', disabled: true },
  { key: 'rfqs', path: '/rfqs', icon: <FileSearchOutlined />, labelKey: 'nav.rfqs', disabled: true },
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
  const { t } = useTranslation();

  const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? 'profile';

  const userMenu: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: t('nav.signOut'), onClick: logout },
  ];

  function goTo(path: string) {
    navigate(path);
    setDrawerOpen(false);
  }

  const navMenu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={NAV_ITEMS.map(({ key, icon, labelKey, disabled }) => ({
        key,
        icon,
        disabled,
        label: disabled ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {t(labelKey)}
            <Tag style={{ margin: 0, fontSize: 10 }}>{t('common.comingSoon')}</Tag>
          </span>
        ) : (
          t(labelKey)
        ),
      }))}
      onClick={({ key }) => {
        const item = NAV_ITEMS.find((i) => i.key === key);
        if (item && !item.disabled) goTo(item.path);
      }}
      style={{ background: 'transparent', border: 'none', padding: '0 12px' }}
    />
  );

  const sectionLabel = (
    <div style={{ padding: '16px 20px 4px', fontSize: 11, letterSpacing: 1, color: palette.textTertiary, fontWeight: 600 }}>
      MAIN
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider width={240} style={{ borderRight: `1px solid ${palette.border}` }}>
          <Logo />
          {sectionLabel}
          {navMenu}
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
          {sectionLabel}
          {navMenu}
        </Drawer>
      )}

      <Layout>
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
