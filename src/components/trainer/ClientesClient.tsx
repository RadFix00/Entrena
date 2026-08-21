"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
} from "lucide-react";

import UserAvatar from "@/components/profile/UserAvatar";

export type ClienteUI = {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  iniciales: string;
  plan: string;
  semana: string;
  adherencia: number | null;
  estado: "Activo" | "Revisar" | "Pausado";
  ultimoEntrenamiento: string;
};

type ClientesClientProps = {
  clientes: ClienteUI[];
};

function badgeEstado(estado: ClienteUI["estado"]) {
  switch (estado) {
    case "Activo":
      return "bg-emerald-50 text-emerald-700";

    case "Revisar":
      return "bg-amber-50 text-amber-700";

    case "Pausado":
      return "bg-slate-100 text-slate-600";
  }
}

export default function ClientesClient({
  clientes,
}: ClientesClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [plan, setPlan] = useState("Todos");

  const planes = useMemo(() => {
    return Array.from(
      new Set(clientes.map((cliente) => cliente.plan))
    );
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const termino = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        cliente.nombre.toLowerCase().includes(termino) ||
        cliente.email.toLowerCase().includes(termino) ||
        cliente.plan.toLowerCase().includes(termino);

      const coincideEstado =
        estado === "Todos" || cliente.estado === estado;

      const coincidePlan =
        plan === "Todos" || cliente.plan === plan;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincidePlan
      );
    });
  }, [clientes, busqueda, estado, plan]);

  const activos = clientes.filter(
    (cliente) => cliente.estado === "Activo"
  ).length;

  const revisar = clientes.filter(
    (cliente) => cliente.estado === "Revisar"
  ).length;

  const adherencias = clientes
    .map((cliente) => cliente.adherencia)
    .filter(
      (valor): valor is number =>
        valor !== null
    );

  const adherenciaMedia =
    adherencias.length > 0
      ? Math.round(
          adherencias.reduce(
            (total, valor) => total + valor,
            0
          ) / adherencias.length
        )
      : null;

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Gestión de clientes
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Clientes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra tus clientes, planes y progreso.
          </p>
        </div>

        <Link
          href="/trainer/clientes/nuevo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nuevo cliente
        </Link>
      </header>

      {/* Métricas */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total clientes
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {clientes.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Activos
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {activos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Por revisar
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {revisar}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Dumbbell size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Adherencia media
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {adherenciaMedia !== null
                  ? `${adherenciaMedia}%`
                  : "—"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filtros */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Buscar por nombre, email o plan..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <SlidersHorizontal
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={estado}
                  onChange={(event) =>
                    setEstado(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 sm:w-40"
                >
                  <option value="Todos">
                    Todos
                  </option>

                  <option value="Activo">
                    Activos
                  </option>

                  <option value="Revisar">
                    Revisar
                  </option>

                  <option value="Pausado">
                    Pausados
                  </option>
                </select>
              </div>

              <select
                value={plan}
                onChange={(event) =>
                  setPlan(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 sm:w-48"
              >
                <option value="Todos">
                  Todos los planes
                </option>

                {planes.map((nombrePlan) => (
                  <option
                    key={nombrePlan}
                    value={nombrePlan}
                  >
                    {nombrePlan}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Mostrando{" "}
            <span className="font-semibold text-slate-900">
              {clientesFiltrados.length}
            </span>{" "}
            clientes
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">
                  Cliente
                </th>

                <th className="px-6 py-4">
                  Plan actual
                </th>

                <th className="px-6 py-4">
                  Progreso
                </th>

                <th className="px-6 py-4">
                  Adherencia
                </th>

                <th className="px-6 py-4">
                  Último entrenamiento
                </th>

                <th className="px-6 py-4">
                  Estado
                </th>

                <th className="px-6 py-4" />
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/trainer/clientes/${cliente.id}`}
                      className="flex items-center gap-3"
                    >
                      <UserAvatar
                        name={cliente.nombre}
                        avatarUrl={cliente.avatarUrl}
                        size="lg"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-900 hover:text-emerald-700">
                          {cliente.nombre}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Mail size={12} />
                          {cliente.email}
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {cliente.plan}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {cliente.semana}
                  </td>

                  <td className="px-6 py-4">
                    {cliente.adherencia !== null ? (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${cliente.adherencia}%`,
                            }}
                          />
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {cliente.adherencia}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        —
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {cliente.ultimoEntrenamiento}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeEstado(
                        cliente.estado
                      )}`}
                    >
                      {cliente.estado}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/trainer/clientes/${cliente.id}`}
                      className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {clientesFiltrados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/trainer/clientes/${cliente.id}`}
              className="block p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {cliente.iniciales}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {cliente.nombre}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {cliente.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeEstado(
                        cliente.estado
                      )}`}
                    >
                      {cliente.estado}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">
                        Plan
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {cliente.plan}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Progreso
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {cliente.semana}
                      </p>
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="mt-1 shrink-0 text-slate-300"
                />
              </div>
            </Link>
          ))}
        </div>

        {clientesFiltrados.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No encontramos clientes
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Intenta cambiar la búsqueda o los filtros.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}