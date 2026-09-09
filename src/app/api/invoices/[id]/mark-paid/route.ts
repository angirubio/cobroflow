import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, orgId: auth.session.orgId, status: "unpaid" },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "paid", paidAt: new Date() },
  });

  return NextResponse.json({ invoice: { ...updated, amount: Number(updated.amount) } });
}
