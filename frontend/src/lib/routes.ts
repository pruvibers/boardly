export function newcomerPreviewHref(employeeId: string): string {
  return `/onboard/${encodeURIComponent(employeeId)}/overview`;
}
