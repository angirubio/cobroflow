"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgingBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceWithMetrics } from "@/lib/types";

function formatEur(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

function nextReminderNumber(invoice: InvoiceWithMetrics): 1 | 2 | 3 | null {
  if (!invoice.reminderSentAt1) return 1;
  if (!invoice.reminderSentAt2) return 2;
  if (!invoice.reminderSentAt3) return 3;
  return null;
}

function InvoiceRow({ invoice }: { invoice: InvoiceWithMetrics }) {
  const queryClient = useQueryClient();
  const defaultReminder = nextReminderNumber(invoice);
  const [reminderChoice, setReminderChoice] = useState(defaultReminder ?? 1);
  const [feedback, setFeedback] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  const sendReminder = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoice.id}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderNumber: reminderChoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar el recordatorio");
      return data;
    },
    onSuccess: (data) => {
      setFeedback(data.message);
      invalidate();
    },
    onError: (err: Error) => setFeedback(err.message),
  });

  const markPaid = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoice.id}/mark-paid`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al marcar como pagada");
      }
    },
    onSuccess: invalidate,
  });

  const deleteInvoice = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al eliminar la factura");
      }
    },
    onSuccess: invalidate,
  });

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="whitespace-nowrap px-4 py-3">
        <div className="font-medium text-gray-900">{invoice.customerName}</div>
        <div className="text-xs text-gray-500">{invoice.customerEmail}</div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-medium">{formatEur(invoice.amount, invoice.currency)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <AgingBadge color={invoice.agingColor}>
          {invoice.daysOverdue > 0 ? `${invoice.daysOverdue} días` : "al día"}
        </AgingBadge>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-gray-600">{invoice.status}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {defaultReminder !== null ? (
            <>
              <select
                value={reminderChoice}
                onChange={(e) => setReminderChoice(Number(e.target.value) as 1 | 2 | 3)}
                className="h-8 rounded-md border border-gray-300 text-xs"
              >
                <option value={1}>Recordatorio 1</option>
                <option value={2}>Recordatorio 2</option>
                <option value={3}>Recordatorio 3</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendReminder.mutate()}
                disabled={sendReminder.isPending}
              >
                {sendReminder.isPending ? "Enviando..." : "Enviar recordatorio"}
              </Button>
            </>
          ) : (
            <span className="text-xs text-gray-400">Todos los recordatorios enviados</span>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markPaid.mutate()}
            disabled={markPaid.isPending}
          >
            Marcar pagada
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("¿Eliminar esta factura?")) deleteInvoice.mutate();
            }}
            disabled={deleteInvoice.isPending}
          >
            Eliminar
          </Button>
        </div>
        {feedback && <p className="mt-1 text-xs text-gray-500">{feedback}</p>}
      </td>
    </tr>
  );
}

export function InvoiceTable({ invoices }: { invoices: InvoiceWithMetrics[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
        No hay facturas pendientes. Importa un CSV para empezar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Importe</th>
            <th className="px-4 py-3 font-medium">Días de retraso</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
