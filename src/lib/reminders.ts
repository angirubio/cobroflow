import type { Invoice, Organization, User } from "@prisma/client";
import { prisma } from "./db";
import { sendEmail } from "./email/sendgrid";
import { buildReminderEmail } from "./email/templates";
import { daysOverdue } from "./invoice-metrics";
import type { EmailTone } from "./types";

export const REMINDER_THRESHOLDS = { 1: 15, 2: 30, 3: 45 } as const;
export type ReminderNumber = 1 | 2 | 3;

interface ReminderCandidate {
  status: string;
  dueDate: Date;
  reminderSentAt1: Date | null;
  reminderSentAt2: Date | null;
  reminderSentAt3: Date | null;
}

/**
 * Which reminder (if any) is due today, in sequence. Uses a "days overdue
 * >= threshold and not yet sent" check rather than an exact-day match so a
 * missed cron run doesn't permanently skip an invoice's reminder.
 */
export function nextDueReminder(
  invoice: ReminderCandidate,
  now: Date = new Date()
): ReminderNumber | null {
  if (invoice.status !== "unpaid") return null;
  const overdue = daysOverdue(invoice.dueDate, now);
  const sentByNumber: Record<ReminderNumber, Date | null> = {
    1: invoice.reminderSentAt1,
    2: invoice.reminderSentAt2,
    3: invoice.reminderSentAt3,
  };
  for (const n of [1, 2, 3] as const) {
    if (!sentByNumber[n] && overdue >= REMINDER_THRESHOLDS[n]) {
      return n;
    }
  }
  return null;
}

function reminderTimestampField(reminderNumber: ReminderNumber, date: Date) {
  switch (reminderNumber) {
    case 1:
      return { reminderSentAt1: date };
    case 2:
      return { reminderSentAt2: date };
    case 3:
      return { reminderSentAt3: date };
  }
}

export interface SendReminderResult {
  ok: boolean;
  error?: string;
}

/** Sends one reminder email for an invoice, logs it, and stamps the invoice on success. */
export async function sendReminderForInvoice(
  invoice: Invoice,
  user: Pick<User, "logoUrl" | "emailTone" | "emailCustomMessage">,
  organization: Pick<Organization, "name">,
  reminderNumber: ReminderNumber
): Promise<SendReminderResult> {
  const overdue = daysOverdue(invoice.dueDate);
  const email = buildReminderEmail({
    customerName: invoice.customerName,
    invoiceAmount: Number(invoice.amount),
    currency: invoice.currency,
    daysOverdueValue: overdue,
    reminderNumber,
    tone: user.emailTone as EmailTone,
    companyName: organization.name,
    customMessage: user.emailCustomMessage,
    logoUrl: user.logoUrl,
  });

  const result = await sendEmail({
    to: invoice.customerEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  await prisma.emailLog.create({
    data: {
      invoiceId: invoice.id,
      reminderNumber,
      emailTo: invoice.customerEmail,
      subject: email.subject,
      status: result.ok ? "sent" : "failed",
    },
  });

  if (result.ok) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: reminderTimestampField(reminderNumber, new Date()),
    });
  }

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Finds every unpaid invoice across all orgs that owes a reminder today and sends it. */
export async function runDailyReminderJob(): Promise<{ sent: number; failed: number }> {
  const invoices = await prisma.invoice.findMany({
    where: { status: "unpaid" },
    include: { organization: { include: { users: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const invoice of invoices) {
    const reminderNumber = nextDueReminder(invoice);
    if (!reminderNumber) continue;

    const user = invoice.organization.users[0];
    if (!user) continue;

    const result = await sendReminderForInvoice(invoice, user, invoice.organization, reminderNumber);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { sent, failed };
}
