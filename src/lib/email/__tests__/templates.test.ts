import { describe, expect, it } from "vitest";
import { buildReminderEmail } from "../templates";

describe("buildReminderEmail", () => {
  const base = {
    customerName: "Acme SL",
    invoiceAmount: 1250.5,
    currency: "EUR",
    daysOverdueValue: 20,
    reminderNumber: 1 as const,
    tone: "professional" as const,
    companyName: "Mi Asesoría",
  };

  it("includes the formatted amount and customer name", () => {
    const email = buildReminderEmail(base);
    expect(email.html).toContain("Acme SL");
    expect(email.text).toContain("Acme SL");
    expect(email.text).toContain("1250,50");
  });

  it("varies the subject line by reminder number and tone", () => {
    const first = buildReminderEmail({ ...base, reminderNumber: 1 });
    const third = buildReminderEmail({ ...base, reminderNumber: 3, tone: "strict" });
    expect(first.subject).not.toBe(third.subject);
  });

  it("escapes HTML in the custom message to avoid injection", () => {
    const email = buildReminderEmail({ ...base, customMessage: "<script>alert(1)</script>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
