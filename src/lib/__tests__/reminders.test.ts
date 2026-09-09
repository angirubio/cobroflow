import { describe, expect, it } from "vitest";
import { nextDueReminder } from "../reminders";

const now = new Date(2026, 2, 1);

function invoice(overrides: Partial<Parameters<typeof nextDueReminder>[0]>) {
  return {
    status: "unpaid",
    dueDate: now,
    reminderSentAt1: null,
    reminderSentAt2: null,
    reminderSentAt3: null,
    ...overrides,
  };
}

describe("nextDueReminder", () => {
  it("returns null for paid invoices", () => {
    const inv = invoice({ status: "paid", dueDate: new Date(2026, 0, 1) });
    expect(nextDueReminder(inv, now)).toBeNull();
  });

  it("returns null when not yet overdue enough for reminder 1", () => {
    const inv = invoice({ dueDate: new Date(2026, 1, 25) }); // 4 days overdue
    expect(nextDueReminder(inv, now)).toBeNull();
  });

  it("returns 1 at 15 days overdue when unsent", () => {
    const inv = invoice({ dueDate: new Date(2026, 1, 14) }); // 15 days overdue
    expect(nextDueReminder(inv, now)).toBe(1);
  });

  it("returns 2 at 30 days overdue once reminder 1 was sent", () => {
    const inv = invoice({
      dueDate: new Date(2026, 0, 30), // 30 days overdue
      reminderSentAt1: new Date(2026, 1, 14),
    });
    expect(nextDueReminder(inv, now)).toBe(2);
  });

  it("still returns 1 if never sent, even when far past 30 days overdue", () => {
    const inv = invoice({ dueDate: new Date(2025, 10, 1) }); // well past 45 days
    expect(nextDueReminder(inv, now)).toBe(1);
  });

  it("returns null once all three reminders were sent", () => {
    const inv = invoice({
      dueDate: new Date(2025, 10, 1),
      reminderSentAt1: new Date(2025, 10, 16),
      reminderSentAt2: new Date(2025, 11, 1),
      reminderSentAt3: new Date(2025, 11, 16),
    });
    expect(nextDueReminder(inv, now)).toBeNull();
  });
});
