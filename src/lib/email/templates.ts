import type { EmailTone } from "../types";

export interface ReminderEmailInput {
  customerName: string;
  invoiceAmount: number;
  currency: string;
  daysOverdueValue: number;
  reminderNumber: 1 | 2 | 3;
  tone: EmailTone;
  companyName: string;
  customMessage?: string | null;
  logoUrl?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

const SUBJECTS: Record<EmailTone, Record<1 | 2 | 3, string>> = {
  friendly: {
    1: "Recordatorio amistoso: factura pendiente de pago",
    2: "¿Se te pasó? Segundo recordatorio de tu factura",
    3: "Último aviso amistoso sobre tu factura pendiente",
  },
  professional: {
    1: "Recordatorio de pago pendiente",
    2: "Segundo aviso: factura pendiente de pago",
    3: "Aviso final: factura pendiente de pago",
  },
  strict: {
    1: "Aviso de factura vencida",
    2: "Segundo aviso de factura vencida - acción requerida",
    3: "Aviso final antes de proceder según lo acordado",
  },
};

const INTROS: Record<EmailTone, Record<1 | 2 | 3, string>> = {
  friendly: {
    1: "Esperamos que todo vaya genial. Solo queríamos recordarte, de forma amistosa, que tienes una factura pendiente de pago.",
    2: "Te escribimos de nuevo porque vemos que la factura sigue pendiente. Seguro que se te pasó, ¡nos pasa a todos!",
    3: "Este es nuestro último recordatorio sobre esta factura, que sigue pendiente de pago desde hace un tiempo.",
  },
  professional: {
    1: "Le escribimos para recordarle que la siguiente factura se encuentra pendiente de pago.",
    2: "Le enviamos un segundo aviso ya que, según nuestros registros, la factura continúa pendiente de pago.",
    3: "Le enviamos un aviso final respecto a la factura indicada a continuación, que permanece pendiente de pago.",
  },
  strict: {
    1: "La siguiente factura ha superado su fecha de vencimiento y continúa pendiente de pago.",
    2: "Esta es la segunda notificación relativa a una factura vencida que requiere atención inmediata.",
    3: "Este es el aviso final antes de que evaluemos las siguientes acciones conforme a lo acordado contractualmente.",
  },
};

export function buildReminderEmail(input: ReminderEmailInput): RenderedEmail {
  const subject = SUBJECTS[input.tone][input.reminderNumber];
  const intro = INTROS[input.tone][input.reminderNumber];
  const amountFormatted = formatAmount(input.invoiceAmount, input.currency);
  const overdueLabel =
    input.daysOverdueValue > 0 ? `${input.daysOverdueValue} días de retraso` : "vencimiento reciente";

  const customBlock = input.customMessage
    ? `<p style="margin-top:16px;color:#374151;">${escapeHtml(input.customMessage)}</p>`
    : "";
  const customText = input.customMessage ? `\n\n${input.customMessage}` : "";

  const logoBlock = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(input.companyName)}" style="max-height:48px;margin-bottom:16px;" />`
    : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111827;">
      ${logoBlock}
      <p>Hola ${escapeHtml(input.customerName)},</p>
      <p>${intro}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Importe</td>
          <td style="padding:8px 0;font-weight:bold;text-align:right;">${amountFormatted}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Estado</td>
          <td style="padding:8px 0;text-align:right;">${overdueLabel}</td>
        </tr>
      </table>
      ${customBlock}
      <p style="margin-top:24px;">Gracias,<br/>${escapeHtml(input.companyName)}</p>
    </div>
  `.trim();

  const text = [
    `Hola ${input.customerName},`,
    "",
    intro,
    "",
    `Importe: ${amountFormatted}`,
    `Estado: ${overdueLabel}`,
    customText,
    "",
    `Gracias,`,
    input.companyName,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
