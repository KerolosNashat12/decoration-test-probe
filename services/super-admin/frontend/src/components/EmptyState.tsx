import type { ReactNode } from 'react';
import { palette } from '../theme';

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 30, color: palette.textTertiary, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: palette.textBase, fontWeight: 600, marginBottom: description ? 4 : 0 }}>{title}</div>
      {description && <div style={{ color: palette.textTertiary, fontSize: 13 }}>{description}</div>}
    </div>
  );
}
