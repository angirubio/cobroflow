import { describe, expect, it } from "vitest";
import { agingColor, computeDashboardSummary, daysOverdue } from "../invoice-metrics";

describe("daysOverdue", () => {
  it("returns 0 when due today", () => {
    const now = new Date(2026, 0, 15);
    expect(daysOverdue(new Date(2026, 0, 15), now)).toBe(0);
  });

  it("returns a positive count for past-due invoices", () => {
    const now = new Date(2026, 0, 30);
    expect(daysOverdue(new Date(2026, 0, 15), now)).toBe(15);
  });

  it("returns a negative count for invoices not yet due", () => {
    const now = new Date(2026, 0, 1);
    expect(daysOverdue(new Date(2026, 0, 15), now)).toBe(-14);
  });
});

describe("agingColor", () => {
  it.each([
    [-5, "green"],
    [0, "green"],
    [15, "green"],
    [16, "yellow"],
    [30, "yellow"],
    [31, "orange"],
    [60, "orange"],
    [61, "red"],
  ] as const)("classifies %i days overdue as %s", (days, expected) => {
    expect(agingColor(days)).toBe(expected);
  });
});

describe("computeDashboardSummary", () => {
  const now = new Date(2026, 0, 31);

  it("sums outstanding amounts and counts invoices over 30 days", () => {
    const summary = computeDashboardSummary(
      [
        { amount: 100, dueDate: new Date(2026, 0, 1), invoiceDate: new Date(2025, 11, 1) }, // 30 days overdue
        { amount: 200, dueDate: new Date(2025, 11, 20), invoiceDate: new Date(2025, 11, 1) }, // 42 days overdue
        { amount: 50, dueDate: new Date(2026, 1, 15), invoiceDate: new Date(2026, 0, 15) }, // not yet due
      ],
      now
    );

    expect(summary.totalOutstanding).toBe(350);
    expect(summary.invoicesCount).toBe(3);
    expect(summary.invoicesOver30Days).toBe(1);
  });

  it("returns zeroed metrics for an empty invoice list", () => {
    const summary = computeDashboardSummary([], now);
    expect(summary).toEqual({
      totalOutstanding: 0,
      invoicesOver30Days: 0,
      averageDso: 0,
      invoicesCount: 0,
    });
  });
});
