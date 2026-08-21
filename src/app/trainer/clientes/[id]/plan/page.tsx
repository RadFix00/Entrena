"use client";

import ActivarPlanButton from "@/components/trainer/ActivarPlanButton";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Dumbbell,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

type Ejercicio = {
  /*
   * ID temporal usado solamente por React.
   */
  id: number;

  /*
   * ID REAL del modelo Exercise en PostgreSQL.
   */
  exerciseId: string;

  nombre: string;
  series: number;
  repeticiones: string;
  carga: string;
  descanso: number;
  notas: string;
};

type DiaEntrenamiento = {
  id: number;
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

type Semana = {
  id: number;
  numero: number;
  dias: DiaEntrenamiento[];
};

type EjercicioBiblioteca = {
  id: string;
  nombre: string;
  grupoMuscular: string | null;
  descripcion: string | null;
  videoUrl: string | null;
};

type RespuestaPlan = {
  cliente: string;
  nombrePlan: string;
  objetivo: string;
  semanas: Semana[];
};

type RespuestaBiblioteca = {
  ejercicios: EjercicioBiblioteca[];
};

/*
 * ============================================================
 * UTILIDADES
 * ============================================================
 */

function crearId() {
  return (
    Date.now() +
    Math.floor(Math.random() * 100000)
  );
}

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function GestionarPlanPage() {
  const params = useParams();

  const idParam = params.id;

  const clienteId = Array.isArray(idParam)
    ? idParam[0]
    : idParam;

  /*
   * ==========================================================
   * ESTADO GENERAL
   * ==========================================================
   */

  const [cliente, setCliente] =
    useState("Cliente");

  const [nombrePlan, setNombrePlan] =
    useState("");

  const [objetivo, setObjetivo] =
    useState("");

  const [semanas, setSemanas] =
    useState<Semana[]>([]);

  const [
    semanaActivaId,
    setSemanaActivaId,
  ] = useState<number | null>(null);

  /*
   * ==========================================================
   * BIBLIOTECA DE EJERCICIOS
   * ==========================================================
   */

  const [
    biblioteca,
    setBiblioteca,
  ] = useState<
    EjercicioBiblioteca[]
  >([]);

  const [
    selectorDiaId,
    setSelectorDiaId,
  ] = useState<number | null>(null);

  const [
    busquedaEjercicio,
    setBusquedaEjercicio,
  ] = useState("");

  /*
   * ==========================================================
   * ESTADOS DE INTERFAZ
   * ==========================================================
   */

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    mensajeGuardado,
    setMensajeGuardado,
  ] = useState(false);

  const [error, setError] =
    useState("");

  /*
   * ==========================================================
   * CARGAR PLAN + BIBLIOTECA DESDE POSTGRESQL
   * ==========================================================
   */

  useEffect(() => {
    if (!clienteId) {
      setError(
        "No se pudo identificar al cliente."
      );

      setCargando(false);

      return;
    }

    let cancelado = false;

    async function cargarDatos() {
      try {
        setCargando(true);
        setError("");

        /*
         * Cargamos el plan y la biblioteca
         * simultáneamente.
         */
        const [
          responsePlan,
          responseEjercicios,
        ] = await Promise.all([
          fetch(
            `/api/trainer/clientes/${clienteId}/plan`
          ),

          fetch(
            "/api/trainer/ejercicios"
          ),
        ]);

        const dataPlan =
          (await responsePlan.json()) as
            | RespuestaPlan
            | { error?: string };

        const dataEjercicios =
          (await responseEjercicios.json()) as
            | RespuestaBiblioteca
            | { error?: string };

        if (!responsePlan.ok) {
          throw new Error(
            "error" in dataPlan
              ? dataPlan.error ??
                  "No se pudo cargar el plan."
              : "No se pudo cargar el plan."
          );
        }

        if (!responseEjercicios.ok) {
          throw new Error(
            "error" in dataEjercicios
              ? dataEjercicios.error ??
                  "No se pudo cargar la biblioteca."
              : "No se pudo cargar la biblioteca."
          );
        }

        if (cancelado) {
          return;
        }

        const plan =
          dataPlan as RespuestaPlan;

        const bibliotecaRecibida =
          dataEjercicios as RespuestaBiblioteca;

        setCliente(plan.cliente);

        setNombrePlan(
          plan.nombrePlan
        );

        setObjetivo(
          plan.objetivo
        );

        const semanasRecibidas =
          Array.isArray(plan.semanas)
            ? plan.semanas
            : [];

        setSemanas(
          semanasRecibidas
        );

        setSemanaActivaId(
          semanasRecibidas[0]?.id ??
            null
        );

        setBiblioteca(
          Array.isArray(
            bibliotecaRecibida.ejercicios
          )
            ? bibliotecaRecibida.ejercicios
            : []
        );
      } catch (error) {
        if (cancelado) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Error cargando los datos."
        );
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  /*
   * ==========================================================
   * SEMANA ACTUAL
   * ==========================================================
   */

  const semanaActiva =
    useMemo(() => {
      if (semanas.length === 0) {
        return undefined;
      }

      return (
        semanas.find(
          (semana) =>
            semana.id ===
            semanaActivaId
        ) ?? semanas[0]
      );
    }, [
      semanas,
      semanaActivaId,
    ]);

  /*
   * ==========================================================
   * MAPA DE BIBLIOTECA
   * ==========================================================
   */

  const bibliotecaPorId =
    useMemo(() => {
      return new Map(
        biblioteca.map(
          (ejercicio) => [
            ejercicio.id,
            ejercicio,
          ]
        )
      );
    }, [biblioteca]);

  /*
   * ==========================================================
   * FILTRAR BIBLIOTECA
   * ==========================================================
   */

  const ejerciciosFiltrados =
    useMemo(() => {
      const termino =
        busquedaEjercicio
          .trim()
          .toLowerCase();

      if (!termino) {
        return biblioteca;
      }

      return biblioteca.filter(
        (ejercicio) => {
          const porNombre =
            ejercicio.nombre
              .toLowerCase()
              .includes(termino);

          const porGrupo =
            ejercicio.grupoMuscular
              ?.toLowerCase()
              .includes(termino) ??
            false;

          const porDescripcion =
            ejercicio.descripcion
              ?.toLowerCase()
              .includes(termino) ??
            false;

          return (
            porNombre ||
            porGrupo ||
            porDescripcion
          );
        }
      );
    }, [
      biblioteca,
      busquedaEjercicio,
    ]);

  /*
   * ==========================================================
   * ACTUALIZAR DÍA
   * ==========================================================
   */

  function actualizarDia(
    diaId: number,
    cambios: Partial<DiaEntrenamiento>
  ) {
    setSemanas((anteriores) =>
      anteriores.map((semana) => {
        if (
          semana.id !==
          semanaActivaId
        ) {
          return semana;
        }

        return {
          ...semana,

          dias: semana.dias.map(
            (dia) =>
              dia.id === diaId
                ? {
                    ...dia,
                    ...cambios,
                  }
                : dia
          ),
        };
      })
    );
  }

  /*
   * ==========================================================
   * ACTUALIZAR PRESCRIPCIÓN DEL EJERCICIO
   * ==========================================================
   */

  function actualizarEjercicio(
    diaId: number,
    ejercicioId: number,
    cambios: Partial<Ejercicio>
  ) {
    setSemanas((anteriores) =>
      anteriores.map((semana) => {
        if (
          semana.id !==
          semanaActivaId
        ) {
          return semana;
        }

        return {
          ...semana,

          dias: semana.dias.map(
            (dia) => {
              if (
                dia.id !== diaId
              ) {
                return dia;
              }

              return {
                ...dia,

                ejercicios:
                  dia.ejercicios.map(
                    (ejercicio) =>
                      ejercicio.id ===
                      ejercicioId
                        ? {
                            ...ejercicio,
                            ...cambios,
                          }
                        : ejercicio
                  ),
              };
            }
          ),
        };
      })
    );
  }

  /*
   * ==========================================================
   * ABRIR SELECTOR DE EJERCICIOS
   * ==========================================================
   */

  function abrirSelectorEjercicio(
    diaId: number
  ) {
    setSelectorDiaId(diaId);
    setBusquedaEjercicio("");
    setError("");
  }

  /*
   * ==========================================================
   * SELECCIONAR EJERCICIO DE LA BIBLIOTECA
   * ==========================================================
   */

  function seleccionarEjercicio(
    ejercicio: EjercicioBiblioteca
  ) {
    if (
      selectorDiaId === null
    ) {
      return;
    }

    const nuevoEjercicio: Ejercicio = {
      id: crearId(),

      /*
       * ID real de PostgreSQL.
       */
      exerciseId: ejercicio.id,

      nombre: ejercicio.nombre,

      series: 3,

      repeticiones: "10",

      carga: "",

      descanso: 90,

      notas: "",
    };

    setSemanas((anteriores) =>
      anteriores.map((semana) => {
        if (
          semana.id !==
          semanaActivaId
        ) {
          return semana;
        }

        return {
          ...semana,

          dias: semana.dias.map(
            (dia) =>
              dia.id ===
              selectorDiaId
                ? {
                    ...dia,

                    ejercicios: [
                      ...dia.ejercicios,
                      nuevoEjercicio,
                    ],
                  }
                : dia
          ),
        };
      })
    );

    setSelectorDiaId(null);
    setBusquedaEjercicio("");
  }

  /*
   * ==========================================================
   * ELIMINAR EJERCICIO DEL DÍA
   *
   * No elimina Exercise de la biblioteca.
   * Solo elimina la asignación del plan.
   * ==========================================================
   */

  function eliminarEjercicio(
    diaId: number,
    ejercicioId: number
  ) {
    setSemanas((anteriores) =>
      anteriores.map((semana) => {
        if (
          semana.id !==
          semanaActivaId
        ) {
          return semana;
        }

        return {
          ...semana,

          dias: semana.dias.map(
            (dia) =>
              dia.id === diaId
                ? {
                    ...dia,

                    ejercicios:
                      dia.ejercicios.filter(
                        (ejercicio) =>
                          ejercicio.id !==
                          ejercicioId
                      ),
                  }
                : dia
          ),
        };
      })
    );
  }

  /*
   * ==========================================================
   * AGREGAR DÍA
   * ==========================================================
   */

  function agregarDia() {
    if (!semanaActiva) {
      return;
    }

    const nuevoDia: DiaEntrenamiento = {
      id: crearId(),

      nombre: `Día ${
        semanaActiva.dias.length +
        1
      }`,

      descripcion: "",

      ejercicios: [],
    };

    setSemanas((anteriores) =>
      anteriores.map((semana) =>
        semana.id ===
        semanaActivaId
          ? {
              ...semana,

              dias: [
                ...semana.dias,
                nuevoDia,
              ],
            }
          : semana
      )
    );
  }

  /*
   * ==========================================================
   * ELIMINAR DÍA
   * ==========================================================
   */

  function eliminarDia(
    diaId: number
  ) {
    const confirmar =
      window.confirm(
        "¿Eliminar este día y todos sus ejercicios?"
      );

    if (!confirmar) {
      return;
    }

    setSemanas((anteriores) =>
      anteriores.map((semana) =>
        semana.id ===
        semanaActivaId
          ? {
              ...semana,

              dias:
                semana.dias.filter(
                  (dia) =>
                    dia.id !== diaId
                ),
            }
          : semana
      )
    );
  }

  /*
   * ==========================================================
   * AGREGAR SEMANA
   * ==========================================================
   */

  function agregarSemana() {
    const numeroMayor =
      semanas.reduce(
        (mayor, semana) =>
          Math.max(
            mayor,
            semana.numero
          ),
        0
      );

    const nuevaSemana: Semana = {
      id: crearId(),

      numero:
        numeroMayor + 1,

      dias: [],
    };

    setSemanas((anteriores) => [
      ...anteriores,
      nuevaSemana,
    ]);

    setSemanaActivaId(
      nuevaSemana.id
    );
  }

  /*
   * ==========================================================
   * DUPLICAR SEMANA
   * ==========================================================
   */

  function duplicarSemana() {
    if (!semanaActiva) {
      return;
    }

    const numeroMayor =
      semanas.reduce(
        (mayor, semana) =>
          Math.max(
            mayor,
            semana.numero
          ),
        0
      );

    const nuevaSemana: Semana = {
      ...semanaActiva,

      id: crearId(),

      numero:
        numeroMayor + 1,

      dias:
        semanaActiva.dias.map(
          (dia) => ({
            ...dia,

            id: crearId(),

            ejercicios:
              dia.ejercicios.map(
                (ejercicio) => ({
                  ...ejercicio,

                  id: crearId(),
                })
              ),
          })
        ),
    };

    setSemanas((anteriores) => [
      ...anteriores,
      nuevaSemana,
    ]);

    setSemanaActivaId(
      nuevaSemana.id
    );
  }

  /*
   * ==========================================================
   * GUARDAR EN POSTGRESQL
   * ==========================================================
   */

  async function guardarCambios() {
    if (!clienteId) {
      setError(
        "No se pudo identificar al cliente."
      );

      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensajeGuardado(false);

      const response = await fetch(
        `/api/trainer/clientes/${clienteId}/plan`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            nombrePlan,
            objetivo,
            semanas,
          }),
        }
      );

      const data =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
          planId?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo guardar el plan."
        );
      }

      setMensajeGuardado(true);

      window.setTimeout(() => {
        setMensajeGuardado(false);
      }, 3000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error guardando el plan."
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (cargando) {
    return (
      <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Dumbbell size={26} />
          </div>

          <p className="mt-4 font-semibold text-slate-900">
            Cargando plan...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Consultando PostgreSQL.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
      {/* ================================================ */}
      {/* VOLVER */}
      {/* ================================================ */}

      <Link
        href={
          clienteId
            ? `/trainer/clientes/${clienteId}`
            : "/trainer/clientes"
        }
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={17} />

        Volver a {cliente}
      </Link>

      {/* ================================================ */}
      {/* HEADER */}
      {/* ================================================ */}

      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <ClipboardList size={17} />

            Plan de entrenamiento
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Gestionar plan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {cliente}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {clienteId && (
            <ActivarPlanButton
              clienteId={clienteId}
            />
          )}

          <button
            type="button"
            onClick={duplicarSemana}
            disabled={!semanaActiva}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={17} />

            Duplicar semana
          </button>

          <button
            type="button"
            onClick={guardarCambios}
            disabled={guardando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mensajeGuardado ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}

            {guardando
              ? "Guardando..."
              : mensajeGuardado
                ? "Guardado"
                : "Guardar cambios"}
          </button>
        </div>
      </header>

      {/* ================================================ */}
      {/* MENSAJES */}
      {/* ================================================ */}

      {mensajeGuardado && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Plan guardado correctamente.
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Cerrar mensaje"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ================================================ */}
      {/* DATOS GENERALES PLAN */}
      {/* ================================================ */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nombre del plan
            </label>

            <input
              value={nombrePlan}
              onChange={(event) =>
                setNombrePlan(
                  event.target.value
                )
              }
              placeholder="Ej. Hipertrofia 12 semanas"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Objetivo
            </label>

            <input
              value={objetivo}
              onChange={(event) =>
                setObjetivo(
                  event.target.value
                )
              }
              placeholder="Ej. Ganancia de masa muscular"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-end">
            <div className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm text-slate-600">
              <CalendarDays size={17} />

              <span>
                {semanas.length}{" "}
                {semanas.length === 1
                  ? "semana"
                  : "semanas"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* SELECTOR SEMANAS */}
      {/* ================================================ */}

      <section className="mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {semanas.map(
            (semana) => {
              const activa =
                semana.id ===
                semanaActivaId;

              return (
                <button
                  key={semana.id}
                  type="button"
                  onClick={() =>
                    setSemanaActivaId(
                      semana.id
                    )
                  }
                  className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                    activa
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Semana{" "}
                  {semana.numero}
                </button>
              );
            }
          )}

          <button
            type="button"
            onClick={agregarSemana}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
          >
            <Plus size={17} />
            Semana
          </button>
        </div>
      </section>

      {/* ================================================ */}
      {/* SEMANA ACTUAL */}
      {/* ================================================ */}

      <section className="mt-4">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {semanaActiva
                ? `Semana ${semanaActiva.numero}`
                : "Sin semana"}
            </h2>

            <p className="text-sm text-slate-500">
              {semanaActiva?.dias
                .length ?? 0}{" "}
              días de entrenamiento
            </p>
          </div>

          <button
            type="button"
            onClick={agregarDia}
            disabled={!semanaActiva}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus size={17} />

            Agregar día
          </button>
        </div>

        {/* Semana vacía */}

        {semanaActiva &&
          semanaActiva.dias.length ===
            0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Dumbbell
                  size={25}
                />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Semana vacía
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Agrega el primer día de
                entrenamiento.
              </p>

              <button
                type="button"
                onClick={agregarDia}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus size={17} />

                Agregar día
              </button>
            </div>
          )}

        {/* ============================================== */}
        {/* DÍAS */}
        {/* ============================================== */}

        <div className="space-y-5">
          {semanaActiva?.dias.map(
            (
              dia,
              indiceDia
            ) => (
              <article
                key={dia.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* ====================================== */}
                {/* CABECERA DÍA */}
                {/* ====================================== */}

                <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                        {indiceDia + 1}
                      </div>

                      <div className="grid flex-1 gap-2 md:grid-cols-2">
                        <input
                          value={
                            dia.nombre
                          }
                          onChange={(
                            event
                          ) =>
                            actualizarDia(
                              dia.id,
                              {
                                nombre:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="bg-transparent text-base font-bold text-slate-900 outline-none"
                        />

                        <input
                          value={
                            dia.descripcion
                          }
                          onChange={(
                            event
                          ) =>
                            actualizarDia(
                              dia.id,
                              {
                                descripcion:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          placeholder="Descripción del entrenamiento"
                          className="bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarDia(
                          dia.id
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2
                        size={16}
                      />

                      Eliminar día
                    </button>
                  </div>
                </div>

                {/* ====================================== */}
                {/* TABLA ESCRITORIO */}
                {/* ====================================== */}

                {dia.ejercicios.length >
                  0 && (
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-3">
                            Ejercicio
                          </th>

                          <th className="w-24 px-3 py-3">
                            Series
                          </th>

                          <th className="w-32 px-3 py-3">
                            Reps
                          </th>

                          <th className="w-32 px-3 py-3">
                            Carga
                          </th>

                          <th className="w-32 px-3 py-3">
                            Descanso
                          </th>

                          <th className="px-3 py-3">
                            Notas
                          </th>

                          <th className="w-16 px-3 py-3" />
                        </tr>
                      </thead>

                      <tbody>
                        {dia.ejercicios.map(
                          (
                            ejercicio
                          ) => {
                            const info =
                              bibliotecaPorId.get(
                                ejercicio.exerciseId
                              );

                            return (
                              <tr
                                key={
                                  ejercicio.id
                                }
                                className="border-b border-slate-100 last:border-0"
                              >
                                {/* EJERCICIO */}

                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                      <Dumbbell
                                        size={
                                          17
                                        }
                                      />
                                    </div>

                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {
                                          ejercicio.nombre
                                        }
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-400">
                                        {info?.grupoMuscular ??
                                          "Biblioteca de ejercicios"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* SERIES */}

                                <td className="px-3 py-3">
                                  <input
                                    type="number"
                                    min={
                                      1
                                    }
                                    value={
                                      ejercicio.series
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          series:
                                            Math.max(
                                              1,
                                              Number(
                                                event
                                                  .target
                                                  .value
                                              ) ||
                                                1
                                            ),
                                        }
                                      )
                                    }
                                    className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                  />
                                </td>

                                {/* REPS */}

                                <td className="px-3 py-3">
                                  <input
                                    value={
                                      ejercicio.repeticiones
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          repeticiones:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-center text-sm outline-none transition focus:border-emerald-500"
                                  />
                                </td>

                                {/* CARGA */}

                                <td className="px-3 py-3">
                                  <input
                                    value={
                                      ejercicio.carga
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          carga:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="kg"
                                    className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-sm outline-none transition focus:border-emerald-500"
                                  />
                                </td>

                                {/* DESCANSO */}

                                <td className="px-3 py-3">
                                  <div className="relative">
                                    <select
                                      value={
                                        ejercicio.descanso
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        actualizarEjercicio(
                                          dia.id,
                                          ejercicio.id,
                                          {
                                            descanso:
                                              Number(
                                                event
                                                  .target
                                                  .value
                                              ),
                                          }
                                        )
                                      }
                                      className="h-9 w-24 appearance-none rounded-lg border border-slate-200 bg-white px-2 pr-7 text-sm outline-none transition focus:border-emerald-500"
                                    >
                                      <option
                                        value={
                                          30
                                        }
                                      >
                                        30 s
                                      </option>

                                      <option
                                        value={
                                          45
                                        }
                                      >
                                        45 s
                                      </option>

                                      <option
                                        value={
                                          60
                                        }
                                      >
                                        60 s
                                      </option>

                                      <option
                                        value={
                                          90
                                        }
                                      >
                                        90 s
                                      </option>

                                      <option
                                        value={
                                          120
                                        }
                                      >
                                        120 s
                                      </option>

                                      <option
                                        value={
                                          180
                                        }
                                      >
                                        180 s
                                      </option>

                                      <option
                                        value={
                                          240
                                        }
                                      >
                                        240 s
                                      </option>
                                    </select>

                                    <ChevronDown
                                      size={
                                        14
                                      }
                                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                  </div>
                                </td>

                                {/* NOTAS */}

                                <td className="px-3 py-3">
                                  <input
                                    value={
                                      ejercicio.notas
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          notas:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="Notas..."
                                    className="h-9 w-full min-w-40 rounded-lg border border-slate-200 px-2 text-sm outline-none transition focus:border-emerald-500"
                                  />
                                </td>

                                {/* ELIMINAR */}

                                <td className="px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      eliminarEjercicio(
                                        dia.id,
                                        ejercicio.id
                                      )
                                    }
                                    aria-label={`Eliminar ${ejercicio.nombre}`}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2
                                      size={
                                        17
                                      }
                                    />
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ====================================== */}
                {/* MÓVIL / TABLET */}
                {/* ====================================== */}

                <div className="divide-y divide-slate-100 xl:hidden">
                  {dia.ejercicios.map(
                    (ejercicio) => {
                      const info =
                        bibliotecaPorId.get(
                          ejercicio.exerciseId
                        );

                      return (
                        <div
                          key={
                            ejercicio.id
                          }
                          className="p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Dumbbell
                                size={17}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">
                                {
                                  ejercicio.nombre
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-emerald-700">
                                {info?.grupoMuscular ??
                                  "Sin grupo muscular"}
                              </p>

                              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {/* SERIES */}

                                <div>
                                  <label className="text-xs text-slate-400">
                                    Series
                                  </label>

                                  <input
                                    type="number"
                                    min={
                                      1
                                    }
                                    value={
                                      ejercicio.series
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          series:
                                            Math.max(
                                              1,
                                              Number(
                                                event
                                                  .target
                                                  .value
                                              ) ||
                                                1
                                            ),
                                        }
                                      )
                                    }
                                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-emerald-500"
                                  />
                                </div>

                                {/* REPS */}

                                <div>
                                  <label className="text-xs text-slate-400">
                                    Reps
                                  </label>

                                  <input
                                    value={
                                      ejercicio.repeticiones
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          repeticiones:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-emerald-500"
                                  />
                                </div>

                                {/* CARGA */}

                                <div>
                                  <label className="text-xs text-slate-400">
                                    Carga
                                  </label>

                                  <input
                                    value={
                                      ejercicio.carga
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          carga:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="kg"
                                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-emerald-500"
                                  />
                                </div>

                                {/* DESCANSO */}

                                <div>
                                  <label className="text-xs text-slate-400">
                                    Descanso
                                  </label>

                                  <select
                                    value={
                                      ejercicio.descanso
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      actualizarEjercicio(
                                        dia.id,
                                        ejercicio.id,
                                        {
                                          descanso:
                                            Number(
                                              event
                                                .target
                                                .value
                                            ),
                                        }
                                      )
                                    }
                                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-emerald-500"
                                  >
                                    <option
                                      value={
                                        30
                                      }
                                    >
                                      30 s
                                    </option>

                                    <option
                                      value={
                                        45
                                      }
                                    >
                                      45 s
                                    </option>

                                    <option
                                      value={
                                        60
                                      }
                                    >
                                      60 s
                                    </option>

                                    <option
                                      value={
                                        90
                                      }
                                    >
                                      90 s
                                    </option>

                                    <option
                                      value={
                                        120
                                      }
                                    >
                                      120 s
                                    </option>

                                    <option
                                      value={
                                        180
                                      }
                                    >
                                      180 s
                                    </option>

                                    <option
                                      value={
                                        240
                                      }
                                    >
                                      240 s
                                    </option>
                                  </select>
                                </div>
                              </div>

                              {/* NOTAS */}

                              <input
                                value={
                                  ejercicio.notas
                                }
                                onChange={(
                                  event
                                ) =>
                                  actualizarEjercicio(
                                    dia.id,
                                    ejercicio.id,
                                    {
                                      notas:
                                        event
                                          .target
                                          .value,
                                    }
                                  )
                                }
                                placeholder="Notas del ejercicio..."
                                className="mt-3 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                eliminarEjercicio(
                                  dia.id,
                                  ejercicio.id
                                )
                              }
                              aria-label={`Eliminar ${ejercicio.nombre}`}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Día sin ejercicios */}

                {dia.ejercicios.length ===
                  0 && (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Dumbbell
                        size={21}
                      />
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Sin ejercicios
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Selecciona ejercicios de
                      tu biblioteca.
                    </p>
                  </div>
                )}

                {/* ====================================== */}
                {/* AGREGAR EJERCICIO */}
                {/* ====================================== */}

                <div className="border-t border-slate-100 p-4">
                  <button
                    type="button"
                    onClick={() =>
                      abrirSelectorEjercicio(
                        dia.id
                      )
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    <Plus size={17} />

                    Agregar ejercicio
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      {/* ================================================ */}
      {/* RESUMEN */}
      {/* ================================================ */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-900">
              Resumen del plan
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {nombrePlan ||
                "Sin nombre"}{" "}
              ·{" "}
              {objetivo ||
                "Sin objetivo"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 px-4 py-2">
              <span className="text-slate-500">
                Semanas:
              </span>{" "}
              <span className="font-bold text-slate-900">
                {semanas.length}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-2">
              <span className="text-slate-500">
                Días:
              </span>{" "}
              <span className="font-bold text-slate-900">
                {semanas.reduce(
                  (
                    total,
                    semana
                  ) =>
                    total +
                    semana.dias
                      .length,
                  0
                )}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-2">
              <span className="text-slate-500">
                Ejercicios:
              </span>{" "}
              <span className="font-bold text-slate-900">
                {semanas.reduce(
                  (
                    total,
                    semana
                  ) =>
                    total +
                    semana.dias.reduce(
                      (
                        subtotal,
                        dia
                      ) =>
                        subtotal +
                        dia
                          .ejercicios
                          .length,
                      0
                    ),
                  0
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* MODAL - SELECTOR DE EJERCICIOS */}
      {/* ================================================ */}

      {selectorDiaId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Agregar ejercicio
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Selecciona un ejercicio
                  de tu biblioteca.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectorDiaId(
                    null
                  );

                  setBusquedaEjercicio(
                    ""
                  );
                }}
                aria-label="Cerrar selector"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Buscador */}

            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  autoFocus
                  value={
                    busquedaEjercicio
                  }
                  onChange={(
                    event
                  ) =>
                    setBusquedaEjercicio(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar por nombre, músculo..."
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Resultados */}

            <div className="flex-1 overflow-y-auto p-3">
              {ejerciciosFiltrados.length >
              0 ? (
                <div className="space-y-2">
                  {ejerciciosFiltrados.map(
                    (
                      ejercicio
                    ) => (
                      <button
                        key={
                          ejercicio.id
                        }
                        type="button"
                        onClick={() =>
                          seleccionarEjercicio(
                            ejercicio
                          )
                        }
                        className="flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left transition hover:border-emerald-100 hover:bg-emerald-50"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Dumbbell
                            size={
                              20
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            {
                              ejercicio.nombre
                            }
                          </p>

                          <p className="mt-0.5 text-xs font-medium text-emerald-700">
                            {ejercicio.grupoMuscular ??
                              "Sin grupo muscular"}
                          </p>

                          {ejercicio.descripcion && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {
                                ejercicio.descripcion
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <Plus
                            size={
                              17
                            }
                          />
                        </div>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search
                    size={25}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 font-semibold text-slate-900">
                    No encontramos
                    ejercicios
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Prueba otra búsqueda
                    o crea un ejercicio
                    nuevo.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                {biblioteca.length}{" "}
                {biblioteca.length ===
                1
                  ? "ejercicio disponible"
                  : "ejercicios disponibles"}
              </p>

              <Link
                href="/trainer/ejercicios"
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Gestionar biblioteca
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}