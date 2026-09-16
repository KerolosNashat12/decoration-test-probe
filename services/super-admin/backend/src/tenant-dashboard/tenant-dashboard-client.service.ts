import { Injectable, Logger } from '@nestjs/common';
import type { Tenant } from '@prisma/client';

export interface ProvisionResult {
  email: string;
  temporaryPassword: string;
  dbName: string;
}

// Talks to the Tenant Dashboard backend's internal API — see
// ARCHITECTURE.md ("Provisioning flow"). This is the ONLY place in Super
// Admin that reaches across to that service; everything else about a
// tenant's own dashboard/data lives over there, never queried directly.
@Injectable()
export class TenantDashboardClientService {
  private readonly logger = new Logger(TenantDashboardClientService.name);

  // Returns null (never throws) when provisioning can't happen or fails —
  // callers treat "no dashboard access yet" as a normal, retryable state,
  // not a reason to fail the approval/retry action itself. See the
  // "Provisioning is decoupled from approval succeeding" note in
  // ARCHITECTURE.md.
  async provisionTenant(tenant: Pick<Tenant, 'id' | 'name' | 'contactName' | 'phone' | 'whatsapp' | 'email' | 'district' | 'categories'>): Promise<ProvisionResult | null> {
    const baseUrl = process.env.TENANT_DASHBOARD_API_URL;
    const secret = process.env.TENANT_DASHBOARD_INTERNAL_SECRET;

    if (!tenant.email) {
      this.logger.warn(`Tenant ${tenant.id} has no email on file — skipping dashboard provisioning`);
      return null;
    }
    if (!baseUrl || !secret) {
      this.logger.warn('TENANT_DASHBOARD_API_URL / TENANT_DASHBOARD_INTERNAL_SECRET not configured — skipping provisioning');
      return null;
    }

    try {
      const response = await fetch(`${baseUrl}/internal/provision-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
        body: JSON.stringify({
          tenantId: tenant.id,
          name: tenant.name,
          contactName: tenant.contactName,
          phone: tenant.phone,
          whatsapp: tenant.whatsapp,
          email: tenant.email,
          district: tenant.district,
          categories: tenant.categories,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Provisioning failed for tenant ${tenant.id}: ${response.status} ${body}`);
        return null;
      }

      return (await response.json()) as ProvisionResult;
    } catch (error) {
      this.logger.error(`Could not reach Tenant Dashboard to provision tenant ${tenant.id}: ${(error as Error).message}`);
      return null;
    }
  }
}
