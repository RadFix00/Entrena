"use client";

import {
  useState,
} from "react";

import {
  Check,
  CopyPlus,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

export type ClienteDestino = {
  id: string;
  nombre: string;
  email: string;
};

type Props = {
  planId: string;

  planNombre:
    string;

  clientIdActual:
    string;

  clientes:
    ClienteDestino[];
};

export default function CopiarPlanClienteButton({
  planId,
  planNombre,
  clientIdActual,
  clientes,
}: Props) {
  const router =
    useRouter();

  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] =
    useState<string | null>(
      null
    );

  const [
    copiando,
    setCopiando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * Excluir el cliente al que
   * ya pertenece el plan.
   */
  const disponibles =
    clientes.filter(
      (cliente) =>
        cliente.id !==
        clientIdActual
    );

  const texto =
    busqueda
      .trim()
      .toLowerCase();

  const filtrados =
    disponibles.filter(
      (cliente) =>
        !texto ||
        cliente.nombre
          .toLowerCase()
          .includes(texto) ||
        cliente.email
          .toLowerCase()
          .includes(texto)
    );

  function abrir() {
    setError("");
    setBusqueda("");

    setClienteSeleccionado(
      null
    );

    setAbierto(true);
  }

  function cerrar() {
    if (copiando) {
      return;
    }

    setAbierto(false);
    setError("");
    setBusqueda("");

    setClienteSeleccionado(
      null
    );
  }

  async function copiar() {
    if (
      !clienteSeleccionado
    ) {
      setError(
        "Selecciona el cliente que recibirá el plan."
      );

      return;
    }

    try {
      setCopiando(true);
      setError("");

      const response =
        await fetch(
          `/api/trainer/planes/${planId}/copiar`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                clientId:
                  clienteSeleccionado,
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;

          error?: string;

          plan?: {
            id: string;
            clientId: string;
          };
        };

      if (
        !response.ok ||
        !data.plan
      ) {
        throw new Error(
          data.error ??
            "No se pudo copiar el plan."
        );
      }

      const destino =
        data.plan.clientId;

      cerrar();

      /*
       * Vamos directamente al editor
       * del cliente destino.
       *
       * Como acabamos de crear el DRAFT,
       * debería ser el borrador más reciente.
       */
      router.push(
        `/trainer/clientes/${destino}/plan`
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo copiar el plan."
      );
    } finally {
      setCopiando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={
          abrir
        }
        disabled={
          disponibles.length ===
          0
        }
        title={
          disponibles.length ===
          0
            ? "No hay otros clientes disponibles"
            : "Copiar este plan a otro cliente"
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CopyPlus
          size={16}
        />

        Copiar a...
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Copiar plan
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {
                    planNombre
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Elige qué cliente recibirá una copia del programa.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cerrar
                }
                disabled={
                  copiando
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {/* BODY */}

            <div className="p-5">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* BUSCADOR */}

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={
                    busqueda
                  }
                  onChange={(
                    event
                  ) =>
                    setBusqueda(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar cliente..."
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* CLIENTES */}

              <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
                {filtrados.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                    <UserRound
                      size={25}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      No encontramos clientes.
                    </p>
                  </div>
                ) : (
                  filtrados.map(
                    (
                      cliente
                    ) => {
                      const seleccionado =
                        clienteSeleccionado ===
                        cliente.id;

                      return (
                        <button
                          key={
                            cliente.id
                          }
                          type="button"
                          disabled={
                            copiando
                          }
                          onClick={() =>
                            setClienteSeleccionado(
                              cliente.id
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            seleccionado
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              seleccionado
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {seleccionado ? (
                              <Check
                                size={18}
                              />
                            ) : (
                              <UserRound
                                size={18}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {
                                cliente.nombre
                              }
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {
                                cliente.email
                              }
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )
                )}
              </div>

              {/* INFO */}

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                La copia se creará como{" "}
                <strong>
                  borrador
                </strong>
                . No reemplazará el plan activo que ya tenga el cliente.
              </div>

              {/* BOTONES */}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    cerrar
                  }
                  disabled={
                    copiando
                  }
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    copiar
                  }
                  disabled={
                    copiando ||
                    !clienteSeleccionado
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiando ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CopyPlus
                      size={17}
                    />
                  )}

                  {copiando
                    ? "Copiando..."
                    : "Copiar plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}