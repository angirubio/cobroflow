import Papa from "papaparse";

export interface ParsedInvoiceRow {
  customerName: string;
  customerEmail: string;
  amount: number;
  invoiceDate: Date;
  dueDate: Date;
}

export interface CsvImportError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  rows: ParsedInvoiceRow[];
  errors: CsvImportError[];
}

type RequiredField = "customerName" | "customerEmail" | "amount" | "invoiceDate" | "dueDate";

const REQUIRED_FIELDS: RequiredField[] = ["customerName", "customerEmail", "amount", "invoiceDate", "dueDate"];

const FIELD_ALIASES: Record<RequiredField, string[]> = {
  customerName: ["customer name", "customer_name", "cliente", "nombre cliente", "nombre"],
  customerEmail: [
    "email",
    "customer email",
    "customer_email",
    "correo",
    "correo electronico",
    "correo electrónico",
  ],
  amount: ["amount", "importe", "monto", "total"],
  invoiceDate: ["invoice date", "invoice_date", "fecha factura", "fecha emision", "fecha emisión"],
  dueDate: ["due date", "due_date", "fecha vencimiento", "vencimiento"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]): Partial<Record<RequiredField, string>> {
  const map: Partial<Record<RequiredField, string>> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const field of REQUIRED_FIELDS) {
      if (FIELD_ALIASES[field].includes(normalized)) {
        map[field] = header;
      }
    }
  }
  return map;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[€$\s]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    // Whichever separator appears last is the decimal separator.
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    cleaned = cleaned.replace(",", ".");
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const [, y, m, d] = iso;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (dmy) {
    const [, d, m, y] = dmy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** Parses a CSV file's raw text into invoice rows, collecting per-row errors instead of throwing. */
export function parseInvoicesCsv(csvText: string): CsvImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ParsedInvoiceRow[] = [];
  const errors: CsvImportError[] = [];

  const headers = parsed.meta.fields ?? [];
  const headerMap = buildHeaderMap(headers);
  const missingFields = REQUIRED_FIELDS.filter((field) => !headerMap[field]);

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `Faltan columnas requeridas en el CSV: ${missingFields.join(", ")}`,
    });
    return { rows, errors };
  }

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2; // header is row 1, data is 1-indexed after it

    const customerName = raw[headerMap.customerName as string]?.trim();
    const customerEmail = raw[headerMap.customerEmail as string]?.trim();
    const amountRaw = raw[headerMap.amount as string]?.trim();
    const invoiceDateRaw = raw[headerMap.invoiceDate as string]?.trim();
    const dueDateRaw = raw[headerMap.dueDate as string]?.trim();

    if (!customerName) {
      errors.push({ row: rowNumber, message: "Falta el nombre del cliente" });
      return;
    }
    if (!customerEmail || !isValidEmail(customerEmail)) {
      errors.push({ row: rowNumber, message: "Email de cliente inválido o vacío" });
      return;
    }

    const amount = parseAmount(amountRaw);
    if (amount === null || amount <= 0) {
      errors.push({ row: rowNumber, message: "Importe inválido" });
      return;
    }

    const invoiceDate = parseDate(invoiceDateRaw);
    if (!invoiceDate) {
      errors.push({ row: rowNumber, message: "Fecha de factura inválida (usa AAAA-MM-DD o DD/MM/AAAA)" });
      return;
    }

    const dueDate = parseDate(dueDateRaw);
    if (!dueDate) {
      errors.push({ row: rowNumber, message: "Fecha de vencimiento inválida (usa AAAA-MM-DD o DD/MM/AAAA)" });
      return;
    }

    rows.push({ customerName, customerEmail, amount, invoiceDate, dueDate });
  });

  return { rows, errors };
}
