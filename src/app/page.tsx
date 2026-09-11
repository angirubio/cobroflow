import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/ui/beta-badge";

const PLANS = [
  {
    name: "Lite",
    price: "49€",
    description: "Para empezar a automatizar recordatorios.",
    features: ["Importación CSV", "Recordatorios automáticos", "Panel de facturas pendientes"],
  },
  {
    name: "Plus",
    price: "99€",
    description: "Para asesorías con más volumen de clientes.",
    features: ["Todo lo de Lite", "Personalización de emails", "Tono de comunicación por cliente"],
  },
  {
    name: "Pro",
    price: "199€",
    description: "Para equipos que necesitan un control a medida.",
    features: ["Todo lo de Plus", "Soporte prioritario", "Configuración a medida"],
  },
];

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-lg font-bold">
            CobroFlow
            <BetaBadge />
          </span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/signup">
              <Button size="sm">Prueba gratis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Dime quién me debe. Le envío recordatorios automáticos.
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          CobroFlow Lite automatiza el seguimiento de facturas pendientes para asesorías, consultoras y
          agencias en España. Importa tu CSV, y deja que los recordatorios se envíen solos.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Empezar gratis</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">Precios</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-gray-500">/mes</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        CobroFlow Lite · Hecho en España
      </footer>
    </main>
  );
}
