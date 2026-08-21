"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  Plus,
  Ruler,
  Save,
  Scale,
  X,
} from "lucide-react";

type Props = {
  clienteId: string;
};

type Formulario = {
  fecha: string;
  pesoKg: string;
  cinturaCm: string;
  pechoCm: string;
  caderaCm: string;
  brazoCm: string;
  musloCm: string;
  notas: string;
};

function fechaHoy() {
  const ahora =
    new Date();

  const year =
    ahora.getFullYear();

  const month =
    String(
      ahora.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      ahora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

const formularioInicial =
  (): Formulario => ({
    fecha:
      fechaHoy(),

    pesoKg: "",
    cinturaCm: "",
    pechoCm: "",
    caderaCm: "",
    brazoCm: "",
    musloCm: "",
    notas: "",
  });

export default function NuevaMedicionForm({
  clienteId,
}: Props) {
  const router =
    useRouter();

  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<Formulario>(
      formularioInicial
    );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  function actualizar(
    campo: keyof Formulario,
    valor: string
  ) {
    setForm(
      (anterior) => ({
        ...anterior,

        [campo]:
          valor,
      })
    );
  }

  function cerrar() {
    if (guardando) {
      return;
    }

    setAbierto(false);
    setError("");

    setForm(
      formularioInicial()
    );
  }

  async function guardar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const response =
        await fetch(
          `/api/trainer/clientes/${clienteId}/mediciones`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                form
              ),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo registrar la medición."
        );
      }

      setAbierto(false);

      setForm(
        formularioInicial()
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la medición."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() =>
          setAbierto(
            true
          )
        }
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        <Plus
          size={18}
        />

        Nueva medición
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-bold text-slate-900">
            Nueva medición
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Puedes registrar solamente los campos que hayas medido.
          </p>
        </div>

        <button
          type="button"
          onClick={
            cerrar
          }
          disabled={
            guardando
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X
            size={19}
          />
        </button>
      </div>

      <form
        onSubmit={
          guardar
        }
        className="p-5"
      >
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* FECHA */}

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Fecha
            </span>

            <div className="relative mt-2">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={
                  form.fecha
                }
                onChange={(
                  event
                ) =>
                  actualizar(
                    "fecha",
                    event.target
                      .value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </label>

          {/* PESO */}

          <CampoMedida
            label="Peso"
            unidad="kg"
            value={
              form.pesoKg
            }
            icon={
              <Scale
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "pesoKg",
                value
              )
            }
          />

          <CampoMedida
            label="Cintura"
            unidad="cm"
            value={
              form.cinturaCm
            }
            icon={
              <Ruler
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "cinturaCm",
                value
              )
            }
          />

          <CampoMedida
            label="Pecho"
            unidad="cm"
            value={
              form.pechoCm
            }
            icon={
              <Ruler
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "pechoCm",
                value
              )
            }
          />

          <CampoMedida
            label="Cadera"
            unidad="cm"
            value={
              form.caderaCm
            }
            icon={
              <Ruler
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "caderaCm",
                value
              )
            }
          />

          <CampoMedida
            label="Brazo"
            unidad="cm"
            value={
              form.brazoCm
            }
            icon={
              <Ruler
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "brazoCm",
                value
              )
            }
          />

          <CampoMedida
            label="Muslo"
            unidad="cm"
            value={
              form.musloCm
            }
            icon={
              <Ruler
                size={17}
              />
            }
            onChange={(
              value
            ) =>
              actualizar(
                "musloCm",
                value
              )
            }
          />
        </div>

        {/* NOTAS */}

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-700">
            Notas
          </span>

          <textarea
            rows={3}
            maxLength={
              1000
            }
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
            placeholder="Ej. medición en ayunas, después de vacaciones..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </label>

        {/* BOTONES */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              cerrar
            }
            disabled={
              guardando
            }
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              guardando
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save
              size={18}
            />

            {guardando
              ? "Guardando..."
              : "Guardar medición"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CampoMedida({
  label,
  unidad,
  value,
  icon,
  onChange,
}: {
  label: string;
  unidad: string;
  value: string;
  icon: React.ReactNode;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative mt-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          inputMode="decimal"
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          placeholder="—"
          className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-sm outline-none focus:border-emerald-500"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unidad}
        </span>
      </div>
    </label>
  );
}