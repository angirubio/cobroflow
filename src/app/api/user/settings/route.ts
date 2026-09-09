import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

const settingsSchema = z.object({
  companyName: z.string().trim().min(1).optional(),
  emailTone: z.enum(["friendly", "professional", "strict"]).optional(),
  emailCustomMessage: z.string().trim().max(500).optional(),
});

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const [user, organization] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.session.userId } }),
    prisma.organization.findUnique({ where: { id: auth.session.orgId } }),
  ]);
  if (!user || !organization) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    companyName: organization.name,
    logoUrl: user.logoUrl,
    emailTone: user.emailTone,
    emailCustomMessage: user.emailCustomMessage,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Datos de formulario inválidos" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse({
    companyName: formData.get("companyName")?.toString() || undefined,
    emailTone: formData.get("emailTone")?.toString() || undefined,
    emailCustomMessage: formData.get("emailCustomMessage")?.toString() || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "El logo no puede superar 2MB" }, { status: 400 });
    }
    if (!ALLOWED_LOGO_TYPES.has(logo.type)) {
      return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });
    }
    // Local filesystem storage is a pragmatic MVP choice for a single Railway
    // instance; swap for object storage (Supabase Storage / S3) before running
    // on ephemeral/serverless compute.
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadsDir, { recursive: true });
    const ext = logo.type.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
    const fileName = `${auth.session.orgId}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await logo.arrayBuffer());
    await writeFile(path.join(uploadsDir, fileName), bytes);
    logoUrl = `/uploads/logos/${fileName}`;
  }

  const user = await prisma.user.update({
    where: { id: auth.session.userId },
    data: {
      ...(parsed.data.emailTone ? { emailTone: parsed.data.emailTone } : {}),
      ...(parsed.data.emailCustomMessage !== undefined
        ? { emailCustomMessage: parsed.data.emailCustomMessage }
        : {}),
      ...(logoUrl ? { logoUrl } : {}),
    },
  });

  if (parsed.data.companyName) {
    await prisma.organization.update({
      where: { id: auth.session.orgId },
      data: { name: parsed.data.companyName },
    });
  }

  return NextResponse.json({
    user: {
      logoUrl: user.logoUrl,
      emailTone: user.emailTone,
      emailCustomMessage: user.emailCustomMessage,
    },
  });
}
