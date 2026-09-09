const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Days past the due date. Negative when the invoice is not yet due. */
export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  const diffMs = startOfDay(now).getTime() - startOfDay(dueDate).getTime();
  return Math.floor(diffMs / MS_PER_DAY);
}

export type AgingColor = "green" | "yellow" | "orange" | "red";

export function agingColor(daysOverdueValue: number): AgingColor {
  const clamped = Math.max(0, daysOverdueValue);
  if (clamped <= 15) return "green";
  if (clamped <= 30) return "yellow";
  if (clamped <= 60) return "orange";
  return "red";
}

interface DashboardInvoiceInput {
  amount: number | string;
  dueDate: Date;
  invoiceDate: Date;
}

export interface DashboardSummary {
  totalOutstanding: number;
  invoicesOver30Days: number;
  averageDso: number;
  invoicesCount: number;
}

/**
 * Average DSO approximated as the mean age (invoice date -> today) of
 * currently outstanding invoices. A true DSO needs period revenue data
 * the MVP doesn't collect, so this proxy is what "Average DSO" means here.
 */
function averageDso(invoices: DashboardInvoiceInput[], now: Date): number {
  if (invoices.length === 0) return 0;
  const totalDays = invoices.reduce((sum, inv) => {
    const age = Math.max(0, daysOverdue(inv.invoiceDate, now));
    return sum + age;
  }, 0);
  return Math.round((totalDays / invoices.length) * 10) / 10;
}

export function computeDashboardSummary(
  invoices: DashboardInvoiceInput[],
  now: Date = new Date()
): DashboardSummary {
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const invoicesOver30Days = invoices.filter((inv) => daysOverdue(inv.dueDate, now) > 30).length;

  return {
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    invoicesOver30Days,
    averageDso: averageDso(invoices, now),
    invoicesCount: invoices.length,
  };
}
