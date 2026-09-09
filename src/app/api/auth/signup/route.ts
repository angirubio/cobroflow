import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signSessionToken } from "@/lib/jwt";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  companyName: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos" },
      { status: 400 }
    );
  }

  const { email, password, firstName, lastName, companyName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  let user, organization;
  try {
    ({ user, organization } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: companyName } });
      const user = await tx.user.create({
        data: {
          orgId: organization.id,
          email,
          passwordHash,
          firstName,
          lastName,
        },
      });
      return { user, organization };
    }));
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
    }
    throw err;
  }

  const token = await signSessionToken({ userId: user.id, orgId: organization.id, email: user.email });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}
