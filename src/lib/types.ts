export type EmailTone = "friendly" | "professional" | "strict";

export interface SessionPayload {
  userId: string;
  orgId: string;
  email: string;
}

export interface ApiError {
  error: string;
}

export interface InvoiceWithMetrics {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: "unpaid" | "paid" | "deleted";
  daysOverdue: number;
  agingColor: "green" | "yellow" | "orange" | "red";
  reminderSentAt1: string | null;
  reminderSentAt2: string | null;
  reminderSentAt3: string | null;
}

export interface DashboardSummaryDto {
  totalOutstanding: number;
  invoicesOver30Days: number;
  averageDso: number;
  invoicesCount: number;
}
