import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { computeDashboardSummary } from "@/lib/invoice-metrics";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const invoices = await prisma.invoice.findMany({
    where: { orgId: auth.session.orgId, status: "unpaid" },
    select: { amount: true, dueDate: true, invoiceDate: true },
  });

  const summary = computeDashboardSummary(
    invoices.map((inv) => ({
      amount: Number(inv.amount),
      dueDate: inv.dueDate,
      invoiceDate: inv.invoiceDate,
    }))
  );

  return NextResponse.json(summary);
}
