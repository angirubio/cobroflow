"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { Button } from "@/components/ui/button";
import type { DashboardSummaryDto, InvoiceWithMetrics } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al cargar ${url}`);
  return res.json();
}

export default function DashboardPage() {
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => fetchJson<{ invoices: InvoiceWithMetrics[] }>("/api/invoices"),
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetchJson<DashboardSummaryDto>("/api/dashboard/summary"),
  });

  const invoices = invoicesQuery.data?.invoices ?? [];
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid");

  if (invoicesQuery.isLoading || summaryQuery.isLoading) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-gray-600">Aún no tienes facturas. Empecemos importando algunas.</p>
        <Link href="/dashboard/import" className="mt-4 inline-block">
          <Button>Importar facturas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facturas</h1>
        <Link href="/dashboard/import">
          <Button variant="outline" size="sm">
            Importar más
          </Button>
        </Link>
      </div>
      {summaryQuery.data && <KpiCards summary={summaryQuery.data} />}
      <InvoiceTable invoices={unpaidInvoices} />
    </div>
  );
}
