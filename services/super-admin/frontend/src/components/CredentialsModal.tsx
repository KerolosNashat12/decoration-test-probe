import { Modal, Typography, Input, Space, Alert, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProvisioningResult } from '../types';

// Reveals a freshly generated tenant-dashboard login exactly once — this
// password isn't stored anywhere in plaintext after this, on either
// service (see ARCHITECTURE.md "Provisioning flow"), so this modal is the
// only chance to copy it down for the tenant.
export function CredentialsModal({
  open,
  credentials,
  onClose,
}: {
  open: boolean;
  credentials: ProvisioningResult | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value).then(() => message.success(label));
  }

  return (
    <Modal
      title={t('credentials.title')}
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText={t('credentials.done')}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t('credentials.warning')} />
      {credentials && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text type="secondary">{t('credentials.loginEmail')}</Typography.Text>
            <Input
              readOnly
              value={credentials.email}
              suffix={<CopyOutlined onClick={() => copy(credentials.email, t('credentials.copiedEmail'))} style={{ cursor: 'pointer' }} />}
            />
          </div>
          <div>
            <Typography.Text type="secondary">{t('credentials.temporaryPassword')}</Typography.Text>
            <Input
              readOnly
              value={credentials.temporaryPassword}
              suffix={
                <CopyOutlined
                  onClick={() => copy(credentials.temporaryPassword, t('credentials.copiedPassword'))}
                  style={{ cursor: 'pointer' }}
                />
              }
            />
          </div>
        </Space>
      )}
    </Modal>
  );
}
