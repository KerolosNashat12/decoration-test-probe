import { Injectable, Logger } from '@nestjs/common';
import type { Tenant } from '@prisma/client';

export interface ProvisionResult {
  email: string;
  temporaryPassword: string;
  dbName: string;
}

// Discriminated union so callers that need to explain a failure to an admin
// (TenantsService.provisionDashboard's retry action) can, while callers that
// intentionally don't care (TenantApplicationsService.approve — provisioning
// is decoupled from approval succeeding) can keep just checking `ok`.
export type ProvisionOutcome = { ok: true; result: ProvisionResult } | { ok: false; reason: string };

// Talks to the Tenant Dashboard backend's internal API — see
// ARCHITECTURE.md ("Provisioning flow"). This is the ONLY place in Super
// Admin that reaches across to that service; everything else about a
// tenant's own dashboard/data lives over there, never queried directly.
@Injectable()
export class TenantDashboardClientService {
  private readonly logger = new Logger(TenantDashboardClientService.name);

  // Never throws — callers that don't care about the reason (e.g. approval,
  // where provisioning is decoupled from approval succeeding — see
  // ARCHITECTURE.md) can just check `ok` and treat "no dashboard access
  // yet" as a normal, retryable state. Callers that DO surface this to an
  // admin (TenantsService.provisionDashboard) get a real reason instead of
  // a one-size-fits-all message: a non-2xx response from the Tenant
  // Dashboard means it was reached and it rejected the request (e.g. a
  // duplicate login email) — that's a different, more actionable situation
  // than the fetch itself failing (DNS/timeout/network), and conflating
  // the two here previously sent admins chasing a "can't reach the
  // service" network problem that didn't exist.
  async provisionTenant(tenant: Pick<Tenant, 'id' | 'name' | 'contactName' | 'phone' | 'whatsapp' | 'email' | 'district' | 'categories'>): Promise<ProvisionOutcome> {
    const baseUrl = process.env.TENANT_DASHBOARD_API_URL;
    const secret = process.env.TENANT_DASHBOARD_INTERNAL_SECRET;

    if (!tenant.email) {
      this.logger.warn(`Tenant ${tenant.id} has no email on file — skipping dashboard provisioning`);
      return { ok: false, reason: 'This tenant has no email on file — add one before provisioning dashboard access.' };
    }
    if (!baseUrl || !secret) {
      this.logger.warn('TENANT_DASHBOARD_API_URL / TENANT_DASHBOARD_INTERNAL_SECRET not configured — skipping provisioning');
      return { ok: false, reason: 'The Tenant Dashboard integration is not configured.' };
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
        // The Tenant Dashboard's own errors (ConflictException, BadRequestException, ...)
        // come back as { message: string }; fall back to a generic reason for anything else
        // (e.g. an unhandled 500) rather than leaking a raw body to the admin UI.
        let reason = 'The Tenant Dashboard service rejected this request — check its logs for details.';
        try {
          const parsed = JSON.parse(body) as { message?: string };
          if (parsed?.message) reason = parsed.message;
        } catch {
          // body wasn't JSON — keep the generic reason
        }
        return { ok: false, reason };
      }

      return { ok: true, result: (await response.json()) as ProvisionResult };
    } catch (error) {
      this.logger.error(`Could not reach Tenant Dashboard to provision tenant ${tenant.id}: ${(error as Error).message}`);
      return { ok: false, reason: 'Could not reach the Tenant Dashboard service to provision access — try again shortly.' };
    }
  }

  // Keeps a tenant's Tenant Dashboard login in sync with Super Admin's
  // suspend/reactivate action. Same fail-soft contract as provisionTenant:
  // never throws, returns false (not an error) if the Tenant Dashboard is
  // unreachable or this tenant was never provisioned — suspending/
  // reactivating in Super Admin must never fail because of this call.
  async setDashboardAccountActive(tenantId: string, isActive: boolean): Promise<boolean> {
    const baseUrl = process.env.TENANT_DASHBOARD_API_URL;
    const secret = process.env.TENANT_DASHBOARD_INTERNAL_SECRET;
    if (!baseUrl || !secret) return false;

    try {
      const response = await fetch(`${baseUrl}/internal/tenant-accounts/${tenantId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
        body: JSON.stringify({ isActive }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok && response.status !== 404) {
        this.logger.error(`Failed to set dashboard account active=${isActive} for tenant ${tenantId}: ${response.status}`);
      }
      return response.ok;
    } catch (error) {
      this.logger.error(`Could not reach Tenant Dashboard to set active=${isActive} for tenant ${tenantId}: ${(error as Error).message}`);
      return false;
    }
  }
}
