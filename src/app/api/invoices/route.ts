import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { agingColor, daysOverdue } from "@/lib/invoice-metrics";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const invoices = await prisma.invoice.findMany({
    where: { orgId: auth.session.orgId, status: { not: "deleted" } },
  });

  const withMetrics = invoices
    .map((invoice) => {
      const overdue = daysOverdue(invoice.dueDate);
      return {
        ...invoice,
        amount: Number(invoice.amount),
        daysOverdue: overdue,
        agingColor: agingColor(overdue),
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return NextResponse.json({ invoices: withMetrics });
}
