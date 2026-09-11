import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

interface DemoInvoiceSeed {
  customerName: string;
  customerEmail: string;
  amount: number;
  /** Relative to "now" at load time, so the demo never looks stale. Negative = not yet due. */
  daysOverdue: number;
}

// Emails use the .example domain (RFC 2606, reserved for documentation) so a
// beta tester clicking "Send Reminder" on demo data can never actually
// deliver mail to a real inbox.
const DEMO_INVOICES: DemoInvoiceSeed[] = [
  { customerName: "Constructora Martínez S.L.", customerEmail: "facturacion@constructoramartinez.example", amount: 2500.0, daysOverdue: -10 },
  { customerName: "Panadería El Trigal", customerEmail: "pedidos@eltrigal.example", amount: 340.5, daysOverdue: -3 },
  { customerName: "Clínica Dental Sonrisas", customerEmail: "administracion@clinicasonrisas.example", amount: 890.0, daysOverdue: 2 },
  { customerName: "Talleres Hermanos García", customerEmail: "taller@hermanosgarcia.example", amount: 1250.75, daysOverdue: 8 },
  { customerName: "Restaurante La Terraza", customerEmail: "gerencia@laterraza.example", amount: 615.2, daysOverdue: 15 },
  { customerName: "Consultoría Fiscal Pérez & Asociados", customerEmail: "pagos@perezasociados.example", amount: 3200.0, daysOverdue: 16 },
  { customerName: "Peluquería Estilo Urbano", customerEmail: "info@estilourbano.example", amount: 180.0, daysOverdue: 22 },
  { customerName: "Ferretería Central", customerEmail: "compras@ferreteriacentral.example", amount: 425.9, daysOverdue: 30 },
  { customerName: "Academia de Idiomas Global", customerEmail: "secretaria@idiomasglobal.example", amount: 950.0, daysOverdue: 31 },
  { customerName: "Inmobiliaria Costa Azul", customerEmail: "contabilidad@costaazul.example", amount: 4800.0, daysOverdue: 40 },
  { customerName: "Gimnasio FitZone", customerEmail: "admin@fitzone.example", amount: 275.0, daysOverdue: 60 },
  { customerName: "Óptica Visión Clara", customerEmail: "tienda@visionclara.example", amount: 510.3, daysOverdue: 61 },
  { customerName: "Agencia de Marketing Digital Norte", customerEmail: "finanzas@marketingnorte.example", amount: 2100.0, daysOverdue: 75 },
  { customerName: "Floristería Primavera", customerEmail: "pedidos@floristeriaprimavera.example", amount: 145.6, daysOverdue: 95 },
  { customerName: "Transportes Rápidos S.L.", customerEmail: "logistica@transportesrapidos.example", amount: 1875.4, daysOverdue: 130 },
];

const TYPICAL_PAYMENT_TERM_DAYS = 30;

export async function POST() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const now = new Date();

  // Replaces this org's invoices so repeated clicks don't pile up duplicates.
  // EmailLog rows cascade-delete via the schema's onDelete: Cascade.
  await prisma.invoice.deleteMany({ where: { orgId: auth.session.orgId } });

  await prisma.invoice.createMany({
    data: DEMO_INVOICES.map((seed) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() - seed.daysOverdue);
      const invoiceDate = new Date(dueDate);
      invoiceDate.setDate(invoiceDate.getDate() - TYPICAL_PAYMENT_TERM_DAYS);

      return {
        orgId: auth.session.orgId,
        customerName: seed.customerName,
        customerEmail: seed.customerEmail,
        amount: seed.amount,
        currency: "EUR",
        invoiceDate,
        dueDate,
        status: "unpaid" as const,
      };
    }),
  });

  return NextResponse.json({
    success: true,
    message: `${DEMO_INVOICES.length} facturas de ejemplo cargadas`,
    count: DEMO_INVOICES.length,
  });
}
