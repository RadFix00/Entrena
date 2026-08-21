import prisma from "@/lib/prisma";

import {
  calcularAdherencia,
} from "@/lib/adherence";

import {
  calcularAnaliticaAdherencia,
} from "@/lib/adherence-analytics";

import {
  calcularRiesgoCliente,
} from "@/lib/client-risk";

import type {
  ClientRiskLevel,
} from "@/lib/client-risk";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

export type TrainerRiskClient = {
  clientId: string;

  clientName: string;

  clientEmail: string;

  planId:
    | string
    | null;

  planName:
    | string
    | null;

  level:
    ClientRiskLevel;

  score: number;

  reasons:
    string[];

  adherence30:
    | number
    | null;

  punctuality30:
    | number
    | null;

  trend30:
    | number
    | null;

  consecutiveMissed:
    number;

  missed30: number;

  late30: number;

  overdueDays:
    number;

  today: number;

  upcoming: number;

  nextScheduledDate:
    | string
    | null;
};

export type TrainerRiskOverview = {
  clientes:
    TrainerRiskClient[];

  resumen: {
    total: number;

    critical: number;

    high: number;

    medium: number;

    low: number;

    noData: number;

    requierenAtencion:
      number;
  };
};

/*
 * ============================================================
 * ORDEN RIESGO
 * ============================================================
 */

function prioridad(
  level:
    ClientRiskLevel
) {
  switch (level) {
    case "CRITICAL":
      return 5;

    case "HIGH":
      return 4;

    case "MEDIUM":
      return 3;

    case "LOW":
      return 2;

    default:
      return 1;
  }
}

/*
 * ============================================================
 * CARGAR TODO
 * ============================================================
 */

export async function obtenerRiesgoClientesEntrenador(
  trainerId: string
): Promise<TrainerRiskOverview> {
  /*
   * ============================================
   * 1. CLIENTES
   * ============================================
   */

  const relaciones =
    await prisma.trainerClient.findMany({
      where: {
        trainerId,
      },

      select: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  const clientIds =
    relaciones.map(
      (item) =>
        item.client.id
    );

  if (
    clientIds.length ===
    0
  ) {
    return {
      clientes: [],

      resumen: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        noData: 0,
        requierenAtencion:
          0,
      },
    };
  }

  /*
   * ============================================
   * 2. PLANES ACTIVOS
   * ============================================
   */

  const planes =
    await prisma.trainingPlan.findMany({
      where: {
        trainerId,

        clientId: {
          in:
            clientIds,
        },

        status:
          "ACTIVE",
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      select: {
        id: true,

        clientId:
          true,

        name: true,

        weeks: {
          orderBy: {
            number:
              "asc",
          },

          select: {
            number: true,

            days: {
              orderBy: {
                position:
                  "asc",
              },

              select: {
                id: true,

                position:
                  true,

                scheduledDate:
                  true,
              },
            },
          },
        },
      },
    });

  /*
   * Si por algún problema histórico
   * existen dos ACTIVE para un cliente,
   * usamos el más recientemente actualizado.
   */

  const planPorCliente =
    new Map<
      string,
      (typeof planes)[number]
    >();

  for (
    const plan of planes
  ) {
    if (
      !planPorCliente.has(
        plan.clientId
      )
    ) {
      planPorCliente.set(
        plan.clientId,
        plan
      );
    }
  }

  const planIds =
    Array.from(
      planPorCliente.values()
    ).map(
      (plan) =>
        plan.id
    );

  /*
   * ============================================
   * 3. SESIONES COMPLETADAS
   * ============================================
   */

  const sesiones =
    planIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: {
            trainerId,

            planId: {
              in:
                planIds,
            },

            status:
              "COMPLETED",
          },

          select: {
            planId:
              true,

            workoutDayId:
              true,

            weekNumber:
              true,

            dayPosition:
              true,

            completedAt:
              true,

            startedAt:
              true,
          },
        })
      : [];

  const sesionesPorPlan =
    new Map<
      string,
      typeof sesiones
    >();

  for (
    const sesion of
      sesiones
  ) {
    if (!sesion.planId) {
      continue;
    }

    const actuales =
      sesionesPorPlan.get(
        sesion.planId
      ) ?? [];

    actuales.push(
      sesion
    );

    sesionesPorPlan.set(
      sesion.planId,
      actuales
    );
  }

  /*
   * ============================================
   * 4. ANALIZAR CLIENTES
   * ============================================
   */

  const clientes:
    TrainerRiskClient[] =
      [];

  for (
    const relacion of
      relaciones
  ) {
    const cliente =
      relacion.client;

    const plan =
      planPorCliente.get(
        cliente.id
      );

    /*
     * ==========================================
     * SIN PLAN ACTIVO
     * ==========================================
     */

    if (!plan) {
      clientes.push({
        clientId:
          cliente.id,

        clientName:
          cliente.name,

        clientEmail:
          cliente.email,

        planId: null,

        planName: null,

        level:
          "NO_DATA",

        score: 0,

        reasons: [
          "El cliente no tiene un plan activo.",
        ],

        adherence30:
          null,

        punctuality30:
          null,

        trend30:
          null,

        consecutiveMissed:
          0,

        missed30: 0,

        late30: 0,

        overdueDays: 0,

        today: 0,

        upcoming: 0,

        nextScheduledDate:
          null,
      });

      continue;
    }

    /*
     * ==========================================
     * DÍAS DEL PLAN
     * ==========================================
     */

    const diasPlan =
      plan.weeks.flatMap(
        (semana) =>
          semana.days.map(
            (dia) => ({
              id:
                dia.id,

              weekNumber:
                semana.number,

              position:
                dia.position,

              scheduledDate:
                dia.scheduledDate,
            })
          )
      );

    /*
     * ==========================================
     * SIN CALENDARIO
     * ==========================================
     */

    const tieneCalendario =
      diasPlan.some(
        (dia) =>
          dia.scheduledDate !==
          null
      );

    if (
      !tieneCalendario
    ) {
      clientes.push({
        clientId:
          cliente.id,

        clientName:
          cliente.name,

        clientEmail:
          cliente.email,

        planId:
          plan.id,

        planName:
          plan.name,

        level:
          "NO_DATA",

        score: 0,

        reasons: [
          "El plan activo todavía no tiene calendario.",
        ],

        adherence30:
          null,

        punctuality30:
          null,

        trend30:
          null,

        consecutiveMissed:
          0,

        missed30: 0,

        late30: 0,

        overdueDays: 0,

        today: 0,

        upcoming: 0,

        nextScheduledDate:
          null,
      });

      continue;
    }

    /*
     * ==========================================
     * SESIONES
     * ==========================================
     */

    const sesionesPlan =
      sesionesPorPlan.get(
        plan.id
      ) ?? [];

    const completadas =
      sesionesPlan.map(
        (sesion) => ({
          workoutDayId:
            sesion.workoutDayId,

          weekNumber:
            sesion.weekNumber,

          dayPosition:
            sesion.dayPosition,

          completedAt:
            sesion.completedAt ??
            sesion.startedAt,
        })
      );

    /*
     * ==========================================
     * ADHERENCIA
     * ==========================================
     */

    const adherencia =
      calcularAdherencia({
        dias:
          diasPlan,

        sesiones:
          completadas,

        timeZone:
          "America/Bogota",
      });

    const analytics =
      calcularAnaliticaAdherencia({
        detalle:
          adherencia.detalle,

        timeZone:
          "America/Bogota",
      });

    /*
     * ==========================================
     * RIESGO
     * ==========================================
     */

    const riesgo =
      calcularRiesgoCliente({
        detalle:
          adherencia.detalle,

        analytics,
      });

    /*
     * ==========================================
     * PRÓXIMA SESIÓN
     * ==========================================
     */

    const proximas =
      adherencia.detalle
        .filter(
          (
            item
          ): item is typeof item & {
            scheduledDate: Date;
          } =>
            item.scheduledDate !==
              null &&
            (
              item.status ===
                "TODAY" ||
              item.status ===
                "UPCOMING"
            )
        )
        .sort(
          (a, b) =>
            a.scheduledDate.getTime() -
            b.scheduledDate.getTime()
        );

    clientes.push({
      clientId:
        cliente.id,

      clientName:
        cliente.name,

      clientEmail:
        cliente.email,

      planId:
        plan.id,

      planName:
        plan.name,

      level:
        riesgo.level,

      score:
        riesgo.score,

      reasons:
        riesgo.reasons,

      adherence30:
        analytics.ultimos30
          .adherencia,

      punctuality30:
        analytics.ultimos30
          .puntualidad,

      trend30:
        analytics.tendencia30,

      consecutiveMissed:
        riesgo.consecutiveMissed,

      missed30:
        riesgo.missed30,

      late30:
        riesgo.late30,

      overdueDays:
        riesgo.maxOverdueDays,

      today:
        analytics.totales
          .hoy,

      upcoming:
        analytics.totales
          .proximas,

      nextScheduledDate:
        proximas[0]
          ?.scheduledDate
          .toISOString()
          .slice(
            0,
            10
          ) ??
        null,
    });
  }

  /*
   * ============================================
   * 5. ORDENAR
   * ============================================
   */

  clientes.sort(
    (a, b) => {
      const nivel =
        prioridad(
          b.level
        ) -
        prioridad(
          a.level
        );

      if (
        nivel !== 0
      ) {
        return nivel;
      }

      return (
        b.score -
        a.score
      );
    }
  );

  /*
   * ============================================
   * 6. RESUMEN
   * ============================================
   */

  const critical =
    clientes.filter(
      (item) =>
        item.level ===
        "CRITICAL"
    ).length;

  const high =
    clientes.filter(
      (item) =>
        item.level ===
        "HIGH"
    ).length;

  const medium =
    clientes.filter(
      (item) =>
        item.level ===
        "MEDIUM"
    ).length;

  const low =
    clientes.filter(
      (item) =>
        item.level ===
        "LOW"
    ).length;

  const noData =
    clientes.filter(
      (item) =>
        item.level ===
        "NO_DATA"
    ).length;

  return {
    clientes,

    resumen: {
      total:
        clientes.length,

      critical,

      high,

      medium,

      low,

      noData,

      requierenAtencion:
        critical +
        high +
        medium,
    },
  };
}