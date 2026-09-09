import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { sendReminderForInvoice, type ReminderNumber } from "@/lib/reminders";

const bodySchema = z.object({
  reminderNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Número de recordatorio inválido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, orgId: auth.session.orgId, status: "unpaid" },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const [user, organization] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.session.userId } }),
    prisma.organization.findUnique({ where: { id: auth.session.orgId } }),
  ]);
  if (!user || !organization) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const result = await sendReminderForInvoice(
    invoice,
    user,
    organization,
    parsed.data.reminderNumber as ReminderNumber
  );

  if (!result.ok) {
    return NextResponse.json({ error: `No se pudo enviar el email: ${result.error}` }, { status: 502 });
  }

  return NextResponse.json({ message: `Recordatorio enviado a ${invoice.customerEmail}` });
}
