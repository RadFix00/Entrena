"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  BellRing,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

/*
 * ============================================================
 * MENÚ PRINCIPAL
 * ============================================================
 *
 * Solo dejamos rutas que existen actualmente.
 */

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
    name: "Alertas",
    href: "/trainer/alertas",
    icon: BellRing,
  },
];

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function TrainerSidebar() {
  const pathname =
    usePathname();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  /*
   * ==========================================================
   * BLOQUEAR SCROLL CUANDO EL DRAWER ESTÁ ABIERTO
   * ==========================================================
   */

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setMobileOpen(
          false
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [mobileOpen]);

  /*
   * ==========================================================
   * RUTA ACTIVA
   * ==========================================================
   */

  function isActive(
    href: string
  ) {
    if (
      href ===
      "/trainer/dashboard"
    ) {
      return (
        pathname ===
        href
      );
    }

    return (
      pathname ===
        href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  /*
   * ==========================================================
   * CERRAR DRAWER
   * ==========================================================
   */

  function closeMobile() {
    setMobileOpen(
      false
    );
  }

  return (
    <>
      {/* ==================================================== */}
      {/* SIDEBAR DESKTOP */}
      {/* ==================================================== */}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Logo */}

        <div className="flex h-20 shrink-0 items-center border-b border-slate-100 px-6">
          <Link
            href="/trainer/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Dumbbell
                size={22}
              />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">
                Entrena
              </p>

              <p className="text-xs text-slate-500">
                Panel entrenador
              </p>
            </div>
          </Link>
        </div>

        {/* Navegación */}

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActive(
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={19}
                      className={
                        active
                          ? "text-emerald-600"
                          : "text-slate-400 transition group-hover:text-slate-600"
                      }
                    />

                    <span>
                      {
                        item.name
                      }
                    </span>

                    {item.href ===
                      "/trainer/alertas" && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </Link>
                );
              }
            )}
          </div>
        </nav>

        {/* Footer */}

        <div className="shrink-0 border-t border-slate-100 p-4">
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings
              size={19}
              className="text-slate-400"
            />

            Configuración
          </Link>

          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">
              Sesión
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Administra tu cuenta desde el menú superior.
            </p>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* BOTÓN MOBILE */}
      {/* ==================================================== */}

      <div className="fixed left-4 top-3 z-[55] flex h-10 items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              true
            )
          }
          aria-label="Abrir menú"
          aria-expanded={
            mobileOpen
          }
          aria-controls="trainer-mobile-menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <Menu size={20} />
        </button>

        <Link
          href="/trainer/dashboard"
          className="hidden items-center gap-2 xs:flex sm:flex"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Dumbbell
              size={17}
            />
          </div>

          <span className="text-sm font-bold tracking-tight text-slate-900">
            Entrena
          </span>
        </Link>
      </div>

      {/* ==================================================== */}
      {/* DRAWER MOBILE */}
      {/* ==================================================== */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[80] lg:hidden"
          role="presentation"
        >
          {/* Overlay */}

          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={
              closeMobile
            }
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/45 backdrop-blur-[2px]"
          />

          {/* Panel */}

          <aside
            id="trainer-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú del entrenador"
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-white shadow-2xl"
          >
            {/* Header */}

            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <Link
                href="/trainer/dashboard"
                onClick={
                  closeMobile
                }
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Dumbbell
                    size={21}
                  />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    Entrena
                  </p>

                  <p className="text-xs text-slate-500">
                    Panel entrenador
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={
                  closeMobile
                }
                autoFocus
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              >
                <X size={21} />
              </button>
            </div>

            {/* Navigation */}

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Navegación
              </p>

              <div className="space-y-1">
                {menuItems.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      isActive(
                        item.href
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        onClick={
                          closeMobile
                        }
                        aria-current={
                          active
                            ? "page"
                            : undefined
                        }
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={
                            active
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }
                        />

                        <span>
                          {
                            item.name
                          }
                        </span>

                        {item.href ===
                          "/trainer/alertas" && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
                        )}
                      </Link>
                    );
                  }
                )}
              </div>
            </nav>

            {/* Bottom */}

            <div className="shrink-0 border-t border-slate-100 p-4">
              <Link
                href="/perfil"
                onClick={
                  closeMobile
                }
                className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Settings
                  size={20}
                  className="text-slate-400"
                />

                Configuración de cuenta
              </Link>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-700">
                  Entrena
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Gestión de entrenamiento y seguimiento de clientes.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}