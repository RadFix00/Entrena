"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  FormEvent,
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Ruler,
  Save,
  Scale,
  Target,
  User,
  UserPlus,
} from "lucide-react";

type ClienteForm = {
  nombre: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  alturaCm: string;
  pesoInicialKg: string;
  pesoActualKg: string;
  objetivo: string;
  password: string;
  confirmarPassword: string;
};

const formularioInicial: ClienteForm = {
  nombre: "",
  email: "",
  telefono: "",
  fechaNacimiento: "",
  alturaCm: "",
  pesoInicialKg: "",
  pesoActualKg: "",
  objetivo: "",
  password: "",
  confirmarPassword: "",
};

export default function NuevoClientePage() {
  const router =
    useRouter();

  const [
    formulario,
    setFormulario,
  ] =
    useState<ClienteForm>(
      formularioInicial
    );

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  function actualizarCampo<
    K extends keyof ClienteForm,
  >(
    campo: K,
    valor: ClienteForm[K]
  ) {
    setFormulario(
      (anterior) => ({
        ...anterior,
        [campo]: valor,
      })
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    /*
     * Validación cliente.
     */
    if (
      formulario.password !==
      formulario.confirmarPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );

      return;
    }

    if (
      formulario.password.length <
      8
    ) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres."
      );

      return;
    }

    try {
      setGuardando(true);

      const response =
        await fetch(
          "/api/trainer/clientes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre:
                  formulario.nombre,

                email:
                  formulario.email,

                telefono:
                  formulario.telefono,

                fechaNacimiento:
                  formulario.fechaNacimiento,

                alturaCm:
                  formulario.alturaCm,

                pesoInicialKg:
                  formulario.pesoInicialKg,

                pesoActualKg:
                  formulario.pesoActualKg,

                objetivo:
                  formulario.objetivo,

                password:
                  formulario.password,
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;

          error?: string;

          cliente?: {
            id: string;
            nombre: string;
            email: string;
          };
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo crear el cliente."
        );
      }

      if (!data.cliente?.id) {
        throw new Error(
          "El servidor no devolvió el cliente creado."
        );
      }

      /*
       * Vamos directamente
       * al perfil real.
       */
      router.push(
        `/trainer/clientes/${data.cliente.id}`
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Volver */}

      <Link
        href="/trainer/clientes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Volver a clientes
      </Link>

      {/* Header */}

      <header>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <UserPlus size={18} />
          Gestión de clientes
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Nuevo cliente
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Crea la cuenta y registra
          la información inicial del
          cliente.
        </p>
      </header>

      {/* Formulario */}

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-6"
      >
        {/* Datos personales */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Datos personales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información básica de
              identificación y contacto.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Nombre */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre completo *
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  minLength={2}
                  value={
                    formulario.nombre
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "nombre",
                      event.target
                        .value
                    )
                  }
                  placeholder="Ej. Carolina Rodríguez"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Email */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Correo electrónico *
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={
                    formulario.email
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "email",
                      event.target
                        .value
                    )
                  }
                  placeholder="cliente@ejemplo.com"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Teléfono */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="tel"
                  value={
                    formulario.telefono
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "telefono",
                      event.target
                        .value
                    )
                  }
                  placeholder="+57 300 000 0000"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Fecha */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha de nacimiento
              </label>

              <input
                type="date"
                value={
                  formulario.fechaNacimiento
                }
                onChange={(
                  event
                ) =>
                  actualizarCampo(
                    "fechaNacimiento",
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {/* Datos físicos */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Datos físicos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Valores iniciales para
              empezar a medir el progreso.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {/* Altura */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Altura
              </label>

              <div className="relative">
                <Ruler
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  value={
                    formulario.alturaCm
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "alturaCm",
                      event.target
                        .value
                    )
                  }
                  placeholder="170"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  cm
                </span>
              </div>
            </div>

            {/* Peso inicial */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Peso inicial
              </label>

              <div className="relative">
                <Scale
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={
                    formulario.pesoInicialKg
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "pesoInicialKg",
                      event.target
                        .value
                    )
                  }
                  placeholder="65"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  kg
                </span>
              </div>
            </div>

            {/* Peso actual */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Peso actual
              </label>

              <div className="relative">
                <Scale
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={
                    formulario.pesoActualKg
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "pesoActualKg",
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    formulario
                      .pesoInicialKg ||
                    "65"
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  kg
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Si dejas el peso actual vacío,
            se utilizará el peso inicial.
          </p>
        </section>

        {/* Objetivo */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Target size={20} />
            </div>

            <div className="flex-1">
              <label className="block font-bold text-slate-900">
                Objetivo principal
              </label>

              <p className="mt-1 text-sm text-slate-500">
                ¿Qué quiere conseguir
                este cliente?
              </p>

              <textarea
                rows={3}
                maxLength={500}
                value={
                  formulario.objetivo
                }
                onChange={(
                  event
                ) =>
                  actualizarCampo(
                    "objetivo",
                    event.target
                      .value
                  )
                }
                placeholder="Ej. Ganancia de masa muscular, mejorar fuerza y técnica..."
                className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {/* Acceso */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Acceso a Entrena
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define una contraseña
              temporal para que el cliente
              pueda iniciar sesión.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Password */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Contraseña temporal *
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  minLength={8}
                  maxLength={72}
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    formulario.password
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "password",
                      event.target
                        .value
                    )
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      (actual) =>
                        !actual
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700"
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirmar contraseña *
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  minLength={8}
                  maxLength={72}
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    formulario.confirmarPassword
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarCampo(
                      "confirmarPassword",
                      event.target
                        .value
                    )
                  }
                  placeholder="Repite la contraseña"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            Esta contraseña es temporal.
            Más adelante implementaremos un
            flujo de invitación para que el
            propio cliente configure su
            contraseña.
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Acciones */}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/trainer/clientes"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <>
                <Save size={18} />
                Creando...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Crear cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}