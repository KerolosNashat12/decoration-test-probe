import { Layout, Menu, Typography, Avatar, Dropdown, type MenuProps } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  FileSearchOutlined,
  TeamOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { palette } from '../theme';

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'applications', path: '/applications', icon: <FileSearchOutlined />, label: 'Tenant Applications' },
  { key: 'tenants', path: '/tenants', icon: <ShopOutlined />, label: 'Tenants' },
  { key: 'admin-users', path: '/admin-users', icon: <TeamOutlined />, label: 'Admin Users' },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? 'dashboard';

  const visibleNavItems = NAV_ITEMS.filter((item) => item.key !== 'admin-users' || admin?.role === 'SUPER_ADMIN');

  const userMenu: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: logout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ borderRight: `1px solid ${palette.border}` }}>
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
            }}
          >
            D
          </div>
          <Typography.Text style={{ color: palette.textBase, fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>
            DECORATION
          </Typography.Text>
        </div>

        <div style={{ padding: '16px 20px 4px', fontSize: 11, letterSpacing: 1, color: palette.textTertiary, fontWeight: 600 }}>
          MAIN
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleNavItems.map(({ key, icon, label }) => ({ key, icon, label }))}
          onClick={({ key }) => {
            const item = visibleNavItems.find((i) => i.key === key);
            if (item) navigate(item.path);
          }}
          style={{ background: 'transparent', border: 'none', padding: '0 12px' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: palette.bg,
            borderBottom: `1px solid ${palette.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 20,
            padding: '0 24px',
          }}
        >
          <BellOutlined style={{ color: palette.textSecondary, fontSize: 18 }} />
          <Dropdown menu={{ items: userMenu }} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar style={{ background: palette.primaryActive }}>
                {admin?.name?.charAt(0) ?? '?'}
              </Avatar>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ color: palette.textBase, fontSize: 13, fontWeight: 600 }}>{admin?.name}</div>
                <div style={{ color: palette.textTertiary, fontSize: 11 }}>{admin?.role}</div>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
