"use client";

/**
 * Fetch helper for protected owner pages.
 * A 401 means the HttpOnly owner session is missing/expired. Redirect to the
 * passwordless login page and preserve the current URL so the owner can come
 * straight back after signing in.
 */
export async function ownerFetch(input, init) {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== "undefined") {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const login = new URL("/login", window.location.origin);
    login.searchParams.set("message", "session_expired");
    login.searchParams.set("next", next);

    window.location.replace(`${login.pathname}${login.search}`);

    // Keep callers from rendering a transient "Please sign in" error while
    // the browser is navigating to /login.
    return await new Promise(() => {});
  }

  return response;
}
