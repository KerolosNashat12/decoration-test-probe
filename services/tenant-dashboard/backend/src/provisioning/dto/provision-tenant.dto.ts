import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

// Mirrors the fields Super Admin's Tenant record has, minus its status —
// provisioning only ever runs for a tenant that's already APPROVED there.
export class ProvisionTenantDto {
  @IsString()
  tenantId!: string; // Super Admin Tenant.id — becomes this service's TenantAccount.id too

  @IsString()
  name!: string;

  @IsString()
  contactName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  // Required here even though it's optional on the Super Admin side — it's
  // the tenant's login. The caller (Super Admin) is responsible for not
  // invoking provisioning until the tenant has one on file.
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsArray()
  @IsString({ each: true })
  categories!: string[];
}
