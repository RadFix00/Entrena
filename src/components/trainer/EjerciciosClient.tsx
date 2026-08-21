"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Dumbbell,
  ExternalLink,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

export type EjercicioUI = {
  id: string;
  nombre: string;
  descripcion: string | null;
  grupoMuscular: string | null;
  videoUrl: string | null;
  asignaciones: number;
  creadoEn: string;
};

type Props = {
  ejerciciosIniciales: EjercicioUI[];
};

export default function EjerciciosClient({
  ejerciciosIniciales,
}: Props) {
  const [ejercicios, setEjercicios] =
    useState(ejerciciosIniciales);

  const [busqueda, setBusqueda] = useState("");
  const [grupoFiltro, setGrupoFiltro] =
    useState("Todos");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [grupoMuscular, setGrupoMuscular] =
    useState("");
  const [descripcion, setDescripcion] =
    useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const gruposMusculares = useMemo(() => {
    return Array.from(
      new Set(
        ejercicios
          .map(
            (ejercicio) =>
              ejercicio.grupoMuscular
          )
          .filter(
            (
              grupo
            ): grupo is string =>
              Boolean(grupo)
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [ejercicios]);

  const ejerciciosFiltrados = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase();

    return ejercicios.filter((ejercicio) => {
      const coincideBusqueda =
        ejercicio.nombre
          .toLowerCase()
          .includes(termino) ||
        ejercicio.descripcion
          ?.toLowerCase()
          .includes(termino) ||
        ejercicio.grupoMuscular
          ?.toLowerCase()
          .includes(termino);

      const coincideGrupo =
        grupoFiltro === "Todos" ||
        ejercicio.grupoMuscular ===
          grupoFiltro;

      return (
        coincideBusqueda &&
        coincideGrupo
      );
    });
  }, [
    ejercicios,
    busqueda,
    grupoFiltro,
  ]);

  async function crearEjercicio(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const response = await fetch(
        "/api/trainer/ejercicios",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            nombre,
            grupoMuscular,
            descripcion,
            videoUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo crear el ejercicio."
        );
      }

      const nuevoEjercicio =
        data.ejercicio as EjercicioUI;

      setEjercicios((anteriores) =>
        [...anteriores, nuevoEjercicio].sort(
          (a, b) =>
            a.nombre.localeCompare(
              b.nombre
            )
        )
      );

      setNombre("");
      setGrupoMuscular("");
      setDescripcion("");
      setVideoUrl("");

      setMostrarFormulario(false);

      setMensaje(
        "Ejercicio creado correctamente."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error creando el ejercicio."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarEjercicio(
    ejercicio: EjercicioUI
  ) {
    if (ejercicio.asignaciones > 0) {
      setError(
        "Este ejercicio está utilizado en uno o más planes y no puede eliminarse."
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar "${ejercicio.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response = await fetch(
        `/api/trainer/ejercicios/${ejercicio.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo eliminar el ejercicio."
        );
      }

      setEjercicios((anteriores) =>
        anteriores.filter(
          (item) =>
            item.id !== ejercicio.id
        )
      );

      setMensaje(
        "Ejercicio eliminado."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error eliminando el ejercicio."
      );
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Biblioteca
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ejercicios
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra los ejercicios disponibles
            para tus planes.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMostrarFormulario(true)
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nuevo ejercicio
        </button>
      </header>

      {/* Métricas */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Ejercicios
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {ejercicios.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Grupos musculares
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {gruposMusculares.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Asignaciones
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {ejercicios.reduce(
              (total, ejercicio) =>
                total +
                ejercicio.asignaciones,
              0
            )}
          </p>
        </div>
      </section>

      {/* Mensajes */}
      {mensaje && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Nuevo ejercicio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Agrégalo a tu biblioteca.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMostrarFormulario(false)
              }
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={crearEjercicio}
            className="mt-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre *
                </label>

                <input
                  required
                  value={nombre}
                  onChange={(event) =>
                    setNombre(
                      event.target.value
                    )
                  }
                  placeholder="Ej. Press banca"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Grupo muscular
                </label>

                <input
                  value={grupoMuscular}
                  onChange={(event) =>
                    setGrupoMuscular(
                      event.target.value
                    )
                  }
                  placeholder="Ej. Pecho"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Indicaciones técnicas, ejecución..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Video
                </label>

                <input
                  value={videoUrl}
                  onChange={(event) =>
                    setVideoUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setMostrarFormulario(false)
                }
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save size={17} />

                {guardando
                  ? "Guardando..."
                  : "Guardar ejercicio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Buscador */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:p-5">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busqueda}
              onChange={(event) =>
                setBusqueda(
                  event.target.value
                )
              }
              placeholder="Buscar ejercicio..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={grupoFiltro}
            onChange={(event) =>
              setGrupoFiltro(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none sm:min-w-48"
          >
            <option value="Todos">
              Todos los grupos
            </option>

            {gruposMusculares.map(
              (grupo) => (
                <option
                  key={grupo}
                  value={grupo}
                >
                  {grupo}
                </option>
              )
            )}
          </select>
        </div>

        {/* Ejercicios */}
        {ejerciciosFiltrados.length > 0 ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
            {ejerciciosFiltrados.map(
              (ejercicio) => (
                <article
                  key={ejercicio.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Dumbbell size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900">
                        {ejercicio.nombre}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        {ejercicio.grupoMuscular ??
                          "Sin grupo muscular"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarEjercicio(
                          ejercicio
                        )
                      }
                      disabled={
                        ejercicio.asignaciones >
                        0
                      }
                      title={
                        ejercicio.asignaciones >
                        0
                          ? "No puedes eliminar un ejercicio usado en planes"
                          : "Eliminar ejercicio"
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">
                    {ejercicio.descripcion ??
                      "Sin descripción registrada."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">
                      {ejercicio.asignaciones ===
                      1
                        ? "1 asignación"
                        : `${ejercicio.asignaciones} asignaciones`}
                    </span>

                    {ejercicio.videoUrl && (
                      <a
                        href={
                          ejercicio.videoUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                      >
                        Video
                        <ExternalLink
                          size={13}
                        />
                      </a>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No encontramos ejercicios
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cambia la búsqueda o crea uno
              nuevo.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}