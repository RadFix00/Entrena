import {
  BellRing,
} from "lucide-react";

import {
  requireTrainer,
} from "@/lib/auth-user";

import {
  obtenerRiesgoClientesEntrenador,
} from "@/lib/trainer-risk-data";

import TrainerRiskList from "@/components/trainer/TrainerRiskList";

export default async function TrainerAlertsPage() {
  const trainer =
    await requireTrainer();

  const data =
    await obtenerRiesgoClientesEntrenador(
      trainer.id
    );

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <BellRing
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Seguimiento inteligente
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Alertas de clientes
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Entrena analiza automáticamente la adherencia, sesiones perdidas y cambios de comportamiento para identificar clientes que podrían requerir seguimiento.
          </p>
        </div>
      </header>

      <TrainerRiskList
        data={
          data
        }
      />
    </main>
  );
}