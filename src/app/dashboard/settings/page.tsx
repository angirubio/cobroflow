"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailTone } from "@/lib/types";

interface SettingsDto {
  companyName: string;
  logoUrl: string | null;
  emailTone: EmailTone;
  emailCustomMessage: string | null;
}

export default function SettingsPage() {
  const { data } = useQuery<SettingsDto>({
    queryKey: ["user-settings"],
    queryFn: () => fetch("/api/user/settings").then((res) => res.json()),
  });

  const [companyName, setCompanyName] = useState("");
  const [emailTone, setEmailTone] = useState<EmailTone>("professional");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setCompanyName(data.companyName);
    setEmailTone(data.emailTone);
    setEmailCustomMessage(data.emailCustomMessage ?? "");
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("emailTone", emailTone);
    formData.append("emailCustomMessage", emailCustomMessage);
    if (logoFile) formData.append("logo", logoFile);

    try {
      const res = await fetch("/api/user/settings", { method: "PUT", body: formData });
      const responseData = await res.json();
      if (!res.ok) {
        setFeedback(responseData.error ?? "No se pudieron guardar los ajustes");
        return;
      }
      setFeedback("Ajustes guardados");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold">Ajustes de email</h1>
      <p className="mt-1 text-sm text-gray-500">
        Personaliza cómo se ven los recordatorios que reciben tus clientes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="companyName">Nombre de la empresa</Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="logo">Logo</Label>
          {data?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="Logo actual" className="mb-2 h-10" />
          )}
          <input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="block text-sm"
          />
        </div>

        <div>
          <Label htmlFor="emailTone">Tono de comunicación</Label>
          <select
            id="emailTone"
            value={emailTone}
            onChange={(e) => setEmailTone(e.target.value as EmailTone)}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="friendly">Amistoso</option>
            <option value="professional">Profesional</option>
            <option value="strict">Estricto</option>
          </select>
        </div>

        <div>
          <Label htmlFor="emailCustomMessage">Mensaje personalizado (opcional)</Label>
          <textarea
            id="emailCustomMessage"
            value={emailCustomMessage}
            onChange={(e) => setEmailCustomMessage(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Este mensaje se añade al final de cada recordatorio."
          />
        </div>

        {feedback && <p className="text-sm text-gray-600">{feedback}</p>}

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar ajustes"}
        </Button>
      </form>
    </div>
  );
}
