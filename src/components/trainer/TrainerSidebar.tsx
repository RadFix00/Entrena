"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  BarChart3,
  Settings,
  BellRing,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/trainer/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/trainer/clientes",
    icon: Users,
  },
  {
    name: "Planes",
    href: "/trainer/planes",
    icon: ClipboardList,
  },
  {
    name: "Ejercicios",
    href: "/trainer/ejercicios",
    icon: Dumbbell,
  },
  {
    name: "Progreso",
    href: "/trainer/progreso",
    icon: BarChart3,
  },
  {
    href: "/trainer/alertas",
    name: "Alertas",
    icon: BellRing,
  },
];

export default function TrainerSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Dumbbell size={22} />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">
                Entrena
              </p>
              <p className="text-xs text-slate-500">
                Panel entrenador
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/trainer/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Link
            href="/trainer/configuracion"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Settings size={19} />
            Configuración
          </Link>

          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
              EN
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Entrenador
              </p>

              <p className="truncate text-xs text-slate-500">
                entrenador@entrena.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Dumbbell size={19} />
            </div>

            <span className="font-bold text-slate-900">
              Entrena
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            EN
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-3 pb-3">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600"
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}