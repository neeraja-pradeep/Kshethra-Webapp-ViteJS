import { z } from 'zod'

import type { Permission, PermissionCatalogue, PermissionGroup } from '@/features/rbac/domain/entities/permission'

/** Wire shape of `GET rbac/permissions/`. Django's internal apps are pre-filtered. */
const permissionSchema = z.object({
  id: z.number(),
  value: z.string(),
  name: z.string(),
  codename: z.string(),
  app_label: z.string(),
  model: z.string(),
  is_dangerous: z.boolean(),
  warning: z.string().nullable(),
})

const permissionGroupSchema = z.object({
  app_label: z.string(),
  label: z.string(),
  permissions: z.array(permissionSchema),
})

export const permissionCatalogueResponseSchema = z.object({
  count: z.number(),
  dangerous_permissions: z.array(z.string()),
  groups: z.array(permissionGroupSchema),
})

export type PermissionCatalogueResponseDto = z.infer<typeof permissionCatalogueResponseSchema>

function toPermission(dto: z.infer<typeof permissionSchema>): Permission {
  return {
    id: dto.id,
    value: dto.value,
    name: dto.name,
    codename: dto.codename,
    appLabel: dto.app_label,
    model: dto.model,
    isDangerous: dto.is_dangerous,
    warning: dto.warning,
  }
}

function toPermissionGroup(dto: z.infer<typeof permissionGroupSchema>): PermissionGroup {
  return {
    appLabel: dto.app_label,
    label: dto.label,
    permissions: dto.permissions.map(toPermission),
  }
}

export function toPermissionCatalogue(dto: PermissionCatalogueResponseDto): PermissionCatalogue {
  return {
    count: dto.count,
    dangerousValues: dto.dangerous_permissions,
    groups: dto.groups.map(toPermissionGroup),
  }
}
