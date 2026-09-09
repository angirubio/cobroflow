import { describe, expect, it } from "vitest";
import { parseInvoicesCsv } from "../csv-import";

describe("parseInvoicesCsv", () => {
  it("parses valid rows with English headers", () => {
    const csv = [
      "Customer Name,Email,Amount,Invoice Date,Due Date",
      "Acme SL,acme@example.com,1200.50,2026-01-01,2026-01-31",
    ].join("\n");

    const { rows, errors } = parseInvoicesCsv(csv);

    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      customerName: "Acme SL",
      customerEmail: "acme@example.com",
      amount: 1200.5,
    });
  });

  it("accepts Spanish header aliases and DD/MM/YYYY dates", () => {
    const csv = [
      "Cliente,Correo electrónico,Importe,Fecha factura,Fecha vencimiento",
      "Beta SL,beta@example.com,\"1.234,56\",01/02/2026,03/03/2026",
    ].join("\n");

    const { rows, errors } = parseInvoicesCsv(csv);

    expect(errors).toHaveLength(0);
    expect(rows[0].amount).toBeCloseTo(1234.56);
    expect(rows[0].invoiceDate).toEqual(new Date(2026, 1, 1));
    expect(rows[0].dueDate).toEqual(new Date(2026, 2, 3));
  });

  it("reports a top-level error when required columns are missing", () => {
    const csv = "Name,Email\nAcme,acme@example.com";
    const { rows, errors } = parseInvoicesCsv(csv);

    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(0);
  });

  it("collects per-row errors without dropping valid rows", () => {
    const csv = [
      "Customer Name,Email,Amount,Invoice Date,Due Date",
      "Acme SL,not-an-email,100,2026-01-01,2026-01-31",
      "Beta SL,beta@example.com,200,2026-01-01,2026-01-31",
    ].join("\n");

    const { rows, errors } = parseInvoicesCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].customerName).toBe("Beta SL");
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });
});
