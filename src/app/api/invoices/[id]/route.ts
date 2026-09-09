import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, orgId: auth.session.orgId },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "deleted" } });
  return NextResponse.json({ ok: true });
}
