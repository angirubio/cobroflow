"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ImportResult {
  imported: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export default function ImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshInvoiceData() {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    router.refresh();
  }

  async function handleLoadDemoData() {
    if (
      !confirm(
        "Esto sustituirá todas tus facturas actuales por 15 facturas de ejemplo. ¿Continuar?"
      )
    ) {
      return;
    }

    setIsLoadingDemo(true);
    try {
      const res = await fetch("/api/invoices/load-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar los datos de ejemplo");
      toast.success(`Datos de ejemplo cargados: ${data.count} facturas`);
      setResult(null);
      setError(null);
      refreshInvoiceData();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los datos de ejemplo");
    } finally {
      setIsLoadingDemo(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/invoices/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo importar el archivo");
        return;
      }
      setResult(data);
      refreshInvoiceData();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Importar facturas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube un CSV exportado de tu programa de contabilidad con las columnas: Cliente, Email, Importe,
          Fecha de factura y Fecha de vencimiento.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file"
          />
          <Button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            {isUploading ? "Procesando..." : "Seleccionar archivo CSV"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        o
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900">Probar sin datos propios</h2>
        <p className="mt-1 text-sm text-gray-500">
          Carga 15 facturas de ejemplo para ver cómo funciona CobroFlow.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 border-blue-300 text-blue-600 hover:bg-blue-50"
          disabled={isLoadingDemo}
          onClick={handleLoadDemoData}
        >
          {isLoadingDemo ? "Cargando..." : "Cargar datos de ejemplo"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="font-medium text-gray-900">
            {result.imported} facturas importadas
            {result.errorCount > 0 ? `, ${result.errorCount} con errores` : ""}.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-red-600">
              {result.errors.map((err, idx) => (
                <li key={idx}>
                  Fila {err.row}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
