import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { parseInvoicesCsv } from "@/lib/csv-import";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No se ha subido ningún archivo CSV" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors } = parseInvoicesCsv(text);

  if (rows.length > 0) {
    await prisma.invoice.createMany({
      data: rows.map((row) => ({
        orgId: auth.session.orgId,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        amount: row.amount,
        invoiceDate: row.invoiceDate,
        dueDate: row.dueDate,
      })),
    });
  }

  return NextResponse.json({
    imported: rows.length,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  });
}
