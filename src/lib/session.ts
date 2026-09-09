import { cookies } from "next/headers";
import { verifySessionToken, SESSION_MAX_AGE_SECONDS } from "./jwt";
import type { SessionPayload } from "./types";

export const SESSION_COOKIE_NAME = "cf_session";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Reads and verifies the session from the request cookies. Returns null if absent/invalid. */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
