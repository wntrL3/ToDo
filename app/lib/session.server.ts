const COOKIE_NAME = "userId";

export function getUserId(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)userId=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function createSessionHeaders(userId: string): Headers {
  const headers = new Headers();
  headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(userId)}; HttpOnly; Path=/; SameSite=Lax`
  );
  return headers;
}

export function clearSessionHeaders(): Headers {
  const headers = new Headers();
  headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
  return headers;
}
