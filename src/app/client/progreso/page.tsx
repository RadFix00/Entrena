import Link from "next/link";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Minus,
  Ruler,
  Scale,
  TrendingUp,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireClient } from "@/lib/auth-user";
import { formatearFecha } from "@/lib/format";

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

export default async function ClientProgressPage() {
  const currentUser =
    await requireClient();

  const cliente =
    await prisma.user.findUnique({
      where: {
        id:
          currentUser.id,
      },

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

        bodyMeasurements: {
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
            measuredAt:
              true,
          },
        },
      },
    });

  if (!cliente) {
    return null;
  }

  const pesos =
    cliente.bodyMeasurements
      .map(
        (
          medicion
        ) => {
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
    pesos.length
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
    pesoActual !==
      null &&
    pesoInicial !==
      null
      ? Number(
          (
            pesoActual -
            pesoInicial
          ).toFixed(2)
        )
      : null;

  const ultimaVariacion =
    pesoActual !==
      null &&
    pesoAnterior !==
      null
      ? Number(
          (
            pesoActual -
            pesoAnterior
          ).toFixed(2)
        )
      : null;

  const historial =
    [
      ...cliente.bodyMeasurements,
    ].reverse();

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/client/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al dashboard
      </Link>

      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Mi progreso
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Progreso físico
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Sigue la evolución de tu peso y medidas.
        </p>
      </header>

      {/* CARDS */}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Scale
            size={21}
            className="text-emerald-600"
          />

          <p className="mt-4 text-sm text-slate-500">
            Peso actual
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {pesoActual !==
            null
              ? `${pesoActual} kg`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {cambioTotal ===
            null ||
          cambioTotal ===
            0 ? (
            <Minus
              size={21}
              className="text-slate-500"
            />
          ) : cambioTotal >
            0 ? (
            <ArrowUp
              size={21}
              className="text-emerald-600"
            />
          ) : (
            <ArrowDown
              size={21}
              className="text-emerald-600"
            />
          )}

          <p className="mt-4 text-sm text-slate-500">
            Cambio desde inicio
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {cambioTotal !==
            null
              ? `${
                  cambioTotal >
                  0
                    ? "+"
                    : ""
                }${cambioTotal} kg`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <TrendingUp
            size={21}
            className="text-violet-600"
          />

          <p className="mt-4 text-sm text-slate-500">
            Última variación
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {ultimaVariacion !==
            null
              ? `${
                  ultimaVariacion >
                  0
                    ? "+"
                    : ""
                }${ultimaVariacion} kg`
              : "—"}
          </p>
        </div>
      </section>

      {/* GRÁFICA */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-bold text-slate-900">
          Evolución de peso
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Tus registros a través del tiempo.
        </p>

        <div className="mt-6">
          <WeightChart
            puntos={
              pesos
            }
          />
        </div>
      </section>

      {/* HISTORIAL */}

      <section className="mt-6">
        <h2 className="text-xl font-bold text-slate-900">
          Historial
        </h2>

        {historial.length ===
        0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Ruler
              size={25}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-600">
              Todavía no tienes mediciones registradas.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {historial.map(
              (
                medicion
              ) => (
                <div
                  key={
                    medicion.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="font-bold text-slate-900">
                    {formatearFecha(
                      medicion.measuredAt
                    )}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <Valor
                      label="Peso"
                      valor={
                        numero(
                          medicion.weightKg
                        )
                      }
                      unidad="kg"
                    />

                    <Valor
                      label="Cintura"
                      valor={
                        numero(
                          medicion.waistCm
                        )
                      }
                      unidad="cm"
                    />

                    <Valor
                      label="Pecho"
                      valor={
                        numero(
                          medicion.chestCm
                        )
                      }
                      unidad="cm"
                    />

                    <Valor
                      label="Cadera"
                      valor={
                        numero(
                          medicion.hipCm
                        )
                      }
                      unidad="cm"
                    />

                    <Valor
                      label="Brazo"
                      valor={
                        numero(
                          medicion.armCm
                        )
                      }
                      unidad="cm"
                    />

                    <Valor
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
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Valor({
  label,
  valor,
  unidad,
}: {
  label: string;
  valor: number | null;
  unidad: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {valor !== null
          ? `${valor} ${unidad}`
          : "—"}
      </p>
    </div>
  );
}