import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummaryDto } from "@/lib/types";

function formatEur(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

export function KpiCards({ summary }: { summary: DashboardSummaryDto }) {
  const items = [
    { label: "Total pendiente", value: formatEur(summary.totalOutstanding) },
    { label: "Facturas >30 días", value: summary.invoicesOver30Days.toString() },
    { label: "DSO medio", value: `${summary.averageDso} días` },
    { label: "Facturas pendientes", value: summary.invoicesCount.toString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
