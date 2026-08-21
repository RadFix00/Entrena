import Link from "next/link";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Minus,
  Ruler,
  Scale,
  TrendingUp,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";

import NuevaMedicionForm from "@/components/trainer/NuevaMedicionForm";
import WeightChart from "@/components/progress/WeightChart";

function numero(
  valor:
    | {
        toString(): string;
      }
    | null
    | undefined
) {
  if (
    valor == null
  ) {
    return null;
  }

  return Number(
    valor.toString()
  );
}

function fecha(
  valor: Date
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(valor);
}

function ultimoValor<T>(
  items: T[],
  getter: (
    item: T
  ) => number | null
) {
  for (
    let index =
      items.length - 1;
    index >= 0;
    index--
  ) {
    const valor =
      getter(
        items[index]
      );

    if (
      valor !== null
    ) {
      return valor;
    }
  }

  return null;
}

export default async function ProgresoClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const trainer =
    await requireTrainer();

  const {
    id: clientId,
  } = await params;

  /*
   * ============================================
   * OWNERSHIP + PERFIL
   * ============================================
   */

  const relacion =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId:
            trainer.id,

          clientId,
        },
      },

      select: {
        client: {
          select: {
            id: true,
            name: true,

            profile: {
              select: {
                startWeightKg:
                  true,

                currentWeightKg:
                  true,
              },
            },
          },
        },
      },
    });

  if (!relacion) {
    notFound();
  }

  const cliente =
    relacion.client;

  /*
   * ============================================
   * MEDICIONES
   * ============================================
   */

  const mediciones =
    await prisma.bodyMeasurement.findMany({
      where: {
        clientId:
          cliente.id,
      },

      orderBy: [
        {
          measuredAt:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      select: {
        id: true,

        weightKg:
          true,

        waistCm:
          true,

        chestCm:
          true,

        hipCm:
          true,

        armCm:
          true,

        thighCm:
          true,

        notes:
          true,

        measuredAt:
          true,
      },
    });

  /*
   * ============================================
   * PESOS
   * ============================================
   */

  const pesos =
    mediciones
      .map(
        (medicion) => {
          const peso =
            numero(
              medicion.weightKg
            );

          if (
            peso === null
          ) {
            return null;
          }

          return {
            id:
              medicion.id,

            fecha:
              medicion.measuredAt.toISOString(),

            peso,
          };
        }
      )
      .filter(
        (
          punto
        ): punto is {
          id: string;
          fecha: string;
          peso: number;
        } =>
          punto !== null
      );

  const pesoInicial =
    numero(
      cliente.profile
        ?.startWeightKg
    );

  const pesoActual =
    pesos.length > 0
      ? pesos[
          pesos.length -
            1
        ].peso
      : numero(
          cliente.profile
            ?.currentWeightKg
        );

  const pesoAnterior =
    pesos.length >= 2
      ? pesos[
          pesos.length -
            2
        ].peso
      : null;

  const cambioTotal =
    pesoInicial !==
      null &&
    pesoActual !==
      null
      ? Number(
          (
            pesoActual -
            pesoInicial
          ).toFixed(2)
        )
      : null;

  const ultimaVariacion =
    pesoAnterior !==
      null &&
    pesoActual !==
      null
      ? Number(
          (
            pesoActual -
            pesoAnterior
          ).toFixed(2)
        )
      : null;

  /*
   * ============================================
   * ÚLTIMA MEDIDA DISPONIBLE
   * ============================================
   */

  const cintura =
    ultimoValor(
      mediciones,
      (item) =>
        numero(
          item.waistCm
        )
    );

  const pecho =
    ultimoValor(
      mediciones,
      (item) =>
        numero(
          item.chestCm
        )
    );

  const cadera =
    ultimoValor(
      mediciones,
      (item) =>
        numero(
          item.hipCm
        )
    );

  const brazo =
    ultimoValor(
      mediciones,
      (item) =>
        numero(
          item.armCm
        )
    );

  const muslo =
    ultimoValor(
      mediciones,
      (item) =>
        numero(
          item.thighCm
        )
    );

  const historial =
    [...mediciones]
      .reverse();

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      {/* VOLVER */}

      <Link
        href={`/trainer/clientes/${cliente.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al cliente
      </Link>

      {/* HEADER */}

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Progreso físico
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {cliente.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Evolución de peso y medidas corporales.
          </p>
        </div>

        <NuevaMedicionForm
          clienteId={
            cliente.id
          }
        />
      </header>

      {/* MÉTRICAS */}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          titulo="Peso actual"
          valor={
            pesoActual !==
            null
              ? `${pesoActual} kg`
              : "—"
          }
          icono={
            <Scale
              size={21}
            />
          }
        />

        <TarjetaMetrica
          titulo="Cambio total"
          valor={
            cambioTotal !==
            null
              ? `${
                  cambioTotal >
                  0
                    ? "+"
                    : ""
                }${cambioTotal} kg`
              : "—"
          }
          detalle="Desde el peso inicial"
          icono={
            cambioTotal ===
            null ||
            cambioTotal === 0 ? (
              <Minus
                size={21}
              />
            ) : cambioTotal >
              0 ? (
              <ArrowUp
                size={21}
              />
            ) : (
              <ArrowDown
                size={21}
              />
            )
          }
        />

        <TarjetaMetrica
          titulo="Última variación"
          valor={
            ultimaVariacion !==
            null
              ? `${
                  ultimaVariacion >
                  0
                    ? "+"
                    : ""
                }${ultimaVariacion} kg`
              : "—"
          }
          detalle="Respecto al registro anterior"
          icono={
            <TrendingUp
              size={21}
            />
          }
        />

        <TarjetaMetrica
          titulo="Registros"
          valor={String(
            mediciones.length
          )}
          detalle="Mediciones guardadas"
          icono={
            <Ruler
              size={21}
            />
          }
        />
      </section>

      {/* GRÁFICA */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="font-bold text-slate-900">
            Evolución del peso
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historial cronológico de peso corporal.
          </p>
        </div>

        <div className="mt-6">
          <WeightChart
            puntos={
              pesos
            }
          />
        </div>
      </section>

      {/* MEDIDAS ACTUALES */}

      <section className="mt-6">
        <h2 className="font-bold text-slate-900">
          Últimas medidas registradas
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Medida
            titulo="Cintura"
            valor={
              cintura
            }
          />

          <Medida
            titulo="Pecho"
            valor={
              pecho
            }
          />

          <Medida
            titulo="Cadera"
            valor={
              cadera
            }
          />

          <Medida
            titulo="Brazo"
            valor={
              brazo
            }
          />

          <Medida
            titulo="Muslo"
            valor={
              muslo
            }
          />
        </div>
      </section>

      {/* HISTORIAL */}

      <section className="mt-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Historial de mediciones
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Del registro más reciente al más antiguo.
          </p>
        </div>

        {historial.length ===
        0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Ruler
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              Todavía no hay mediciones.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {historial.map(
              (
                medicion
              ) => (
                <article
                  key={
                    medicion.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div>
                      <p className="font-bold text-slate-900">
                        {fecha(
                          medicion.measuredAt
                        )}
                      </p>

                      {medicion.notes && (
                        <p className="mt-2 max-w-xl text-sm text-slate-500">
                          {
                            medicion.notes
                          }
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <DatoHistorial
                        label="Peso"
                        valor={
                          numero(
                            medicion.weightKg
                          )
                        }
                        unidad="kg"
                      />

                      <DatoHistorial
                        label="Cintura"
                        valor={
                          numero(
                            medicion.waistCm
                          )
                        }
                        unidad="cm"
                      />

                      <DatoHistorial
                        label="Pecho"
                        valor={
                          numero(
                            medicion.chestCm
                          )
                        }
                        unidad="cm"
                      />

                      <DatoHistorial
                        label="Cadera"
                        valor={
                          numero(
                            medicion.hipCm
                          )
                        }
                        unidad="cm"
                      />

                      <DatoHistorial
                        label="Brazo"
                        valor={
                          numero(
                            medicion.armCm
                          )
                        }
                        unidad="cm"
                      />

                      <DatoHistorial
                        label="Muslo"
                        valor={
                          numero(
                            medicion.thighCm
                          )
                        }
                        unidad="cm"
                      />
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function TarjetaMetrica({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icono}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {valor}
      </p>

      {detalle && (
        <p className="mt-1 text-xs text-slate-400">
          {detalle}
        </p>
      )}
    </div>
  );
}

function Medida({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {valor !== null
          ? `${valor} cm`
          : "—"}
      </p>
    </div>
  );
}

function DatoHistorial({
  label,
  valor,
  unidad,
}: {
  label: string;
  valor: number | null;
  unidad: string;
}) {
  return (
    <div className="min-w-[90px] rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold text-slate-800">
        {valor !== null
          ? `${valor} ${unidad}`
          : "—"}
      </p>
    </div>
  );
}