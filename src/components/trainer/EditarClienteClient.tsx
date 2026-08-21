"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  Ruler,
  Save,
  Scale,
  Target,
  User,
} from "lucide-react";

type EstadoCliente =
  | "ACTIVE"
  | "REVIEW"
  | "PAUSED";

export type ClienteEditarInicial = {
  id: string;

  nombre: string;
  email: string;

  telefono: string;
  fechaNacimiento: string;

  alturaCm: string;
  pesoInicialKg: string;
  pesoActualKg: string;

  objetivo: string;

  estado:
    EstadoCliente;

  notas: string;
};

type Props = {
  clienteInicial:
    ClienteEditarInicial;
};

export default function EditarClienteClient({
  clienteInicial,
}: Props) {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<ClienteEditarInicial>(
      clienteInicial
    );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  function actualizar<
    K extends keyof ClienteEditarInicial,
  >(
    campo: K,
    valor:
      ClienteEditarInicial[K]
  ) {
    setForm(
      (anterior) => ({
        ...anterior,
        [campo]:
          valor,
      })
    );
  }

  async function guardar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const response =
        await fetch(
          `/api/trainer/clientes/${form.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre:
                  form.nombre,

                email:
                  form.email,

                telefono:
                  form.telefono,

                fechaNacimiento:
                  form.fechaNacimiento,

                alturaCm:
                  form.alturaCm,

                pesoInicialKg:
                  form.pesoInicialKg,

                pesoActualKg:
                  form.pesoActualKg,

                objetivo:
                  form.objetivo,

                estado:
                  form.estado,

                notas:
                  form.notas,
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo actualizar el cliente."
        );
      }

      setMensaje(
        "Cliente actualizado."
      );

      router.push(
        `/trainer/clientes/${form.id}`
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* VOLVER */}

      <Link
        href={`/trainer/clientes/${form.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al cliente
      </Link>

      {/* HEADER */}

      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Gestión de cliente
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Editar cliente
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Actualiza la información,
          objetivo y estado del cliente.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {mensaje}
        </div>
      )}

      <form
        onSubmit={
          guardar
        }
        className="mt-7 space-y-6"
      >
        {/* ======================================= */}
        {/* DATOS PERSONALES */}
        {/* ======================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Datos personales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información principal
              de la cuenta.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* NOMBRE */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Nombre completo
              </span>

              <div className="relative mt-2">
                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  value={
                    form.nombre
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "nombre",
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>

            {/* EMAIL */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Correo
              </span>

              <div className="relative mt-2">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "email",
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Si cambias el correo,
                ese será el nuevo correo
                de inicio de sesión del
                cliente.
              </p>
            </label>

            {/* TELÉFONO */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Teléfono
              </span>

              <div className="relative mt-2">
                <Phone
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={
                    form.telefono
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "telefono",
                      event.target
                        .value
                    )
                  }
                  placeholder="+57 300 000 0000"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>

            {/* NACIMIENTO */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Fecha de nacimiento
              </span>

              <div className="relative mt-2">
                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={
                    form.fechaNacimiento
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "fechaNacimiento",
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>
          </div>
        </section>

        {/* ======================================= */}
        {/* DATOS FÍSICOS */}
        {/* ======================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Datos físicos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actualiza peso y altura.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {/* ALTURA */}

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Altura
              </span>

              <div className="relative mt-2">
                <Ruler
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  inputMode="decimal"
                  value={
                    form.alturaCm
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "alturaCm",
                      event.target
                        .value
                    )
                  }
                  placeholder="165"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  cm
                </span>
              </div>
            </label>

            {/* PESO INICIAL */}

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Peso inicial
              </span>

              <div className="relative mt-2">
                <Scale
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  inputMode="decimal"
                  value={
                    form.pesoInicialKg
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "pesoInicialKg",
                      event.target
                        .value
                    )
                  }
                  placeholder="62"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  kg
                </span>
              </div>
            </label>

            {/* PESO ACTUAL */}

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Peso actual
              </span>

              <div className="relative mt-2">
                <Scale
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  inputMode="decimal"
                  value={
                    form.pesoActualKg
                  }
                  onChange={(
                    event
                  ) =>
                    actualizar(
                      "pesoActualKg",
                      event.target
                        .value
                    )
                  }
                  placeholder="63.5"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  kg
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* ======================================= */}
        {/* OBJETIVO */}
        {/* ======================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Target
                size={19}
              />
            </div>

            <div className="flex-1">
              <label className="font-bold text-slate-900">
                Objetivo
              </label>

              <textarea
                rows={3}
                value={
                  form.objetivo
                }
                onChange={(
                  event
                ) =>
                  actualizar(
                    "objetivo",
                    event.target
                      .value
                  )
                }
                placeholder="Ej. aumentar masa muscular..."
                className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {/* ======================================= */}
        {/* ESTADO Y NOTAS */}
        {/* ======================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">
            Gestión del entrenador
          </h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Estado
              </span>

              <select
                value={
                  form.estado
                }
                onChange={(
                  event
                ) =>
                  actualizar(
                    "estado",
                    event.target
                      .value as EstadoCliente
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="ACTIVE">
                  Activo
                </option>

                <option value="REVIEW">
                  Revisar
                </option>

                <option value="PAUSED">
                  Pausado
                </option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Notas privadas del
                entrenador
              </span>

              <textarea
                rows={4}
                value={
                  form.notas
                }
                onChange={(
                  event
                ) =>
                  actualizar(
                    "notas",
                    event.target
                      .value
                  )
                }
                placeholder="Seguimiento, observaciones, ajustes pendientes..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Estas notas son para
                el entrenador; no se
                muestran en el dashboard
                del cliente.
              </p>
            </label>
          </div>
        </section>

        {/* ======================================= */}
        {/* BOTONES */}
        {/* ======================================= */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/trainer/clientes/${form.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={
              guardando
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save
              size={18}
            />

            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </form>
    </main>
  );
}