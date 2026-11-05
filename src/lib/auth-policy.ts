export const MIN_PASSWORD_LENGTH = 8;

export function validNewPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function safeAuthDestination(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/editor";
  return path;
}

export function oauthReturnUrl(origin: string): string {
  return `${origin}/auth`;
}