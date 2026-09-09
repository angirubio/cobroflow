import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionPayload } from "./types";

type AuthResult = { session: SessionPayload } | { response: NextResponse };

/** Guard for API routes: returns the session or a 401 response to return immediately. */
export async function requireSession(): Promise<AuthResult> {
  const session = await getSessionUser();
  if (!session) {
    return { response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  return { session };
}
