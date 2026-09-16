import type { ReactNode } from 'react';
import { Typography, Space } from 'antd';
import { palette } from '../theme';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: subtitle ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div>
        <Typography.Title level={4} style={{ margin: 0, color: palette.textBase }}>
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text style={{ color: palette.textTertiary, fontSize: 13 }}>{subtitle}</Typography.Text>
        )}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}
