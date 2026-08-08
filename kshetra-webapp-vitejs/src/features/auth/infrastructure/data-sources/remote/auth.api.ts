import { http } from '@/core/api/http'
import { AUTH_ENDPOINTS, RBAC_ENDPOINTS } from '@/core/config/endpoints'

import type { SignInRequestDto } from '@/features/auth/infrastructure/data-sources/remote/signIn.request'
import {
  myPermissionsResponseSchema,
  type MyPermissionsResponseDto,
} from '@/features/auth/infrastructure/data-sources/remote/myPermissions.response'

/**
 * Back-office sign-in. Note `admin-signin/` admits anyone holding
 * `rbac.access_admin_portal`, not just `temple_admin` — that is how a counter
 * staff member reaches the console.
 */
export async function postAdminSignIn(body: SignInRequestDto): Promise<void> {
  await http.post(AUTH_ENDPOINTS.adminSignIn, body)
}

export async function postLogout(): Promise<void> {
  await http.post(AUTH_ENDPOINTS.logout)
}

export async function getMyPermissions(): Promise<MyPermissionsResponseDto> {
  const response = await http.get(RBAC_ENDPOINTS.myPermissions)
  return myPermissionsResponseSchema.parse(response.data)
}
