"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  ChevronDown,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  signOut,
} from "next-auth/react";

import {
  obtenerIniciales,
} from "@/lib/helpers";

type Props = {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function AccountMenu({
  name,
  email,
  avatarUrl,
  role,
}: Props) {
  const pathname =
    usePathname();

  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [
    avatarError,
    setAvatarError,
  ] = useState(false);

  const contenedorRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
   * ==========================================================
   * ROL
   * ==========================================================
   */

  const esEntrenador =
    role === "TRAINER" ||
    role === "ADMIN";

  const roleLabel =
    role === "ADMIN"
      ? "Administrador"
      : role === "TRAINER"
        ? "Entrenador"
        : "Cliente";

  const dashboardHref =
    esEntrenador
      ? "/trainer/dashboard"
      : "/client/dashboard";

  const iniciales =
    obtenerIniciales(
      name
    );

  /*
   * ==========================================================
   * SI CAMBIA AVATAR, REINTENTAMOS CARGARLO
   * ==========================================================
   */

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  /*
   * ==========================================================
   * CERRAR AL CAMBIAR DE RUTA
   * ==========================================================
   */

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  /*
   * ==========================================================
   * CERRAR AL HACER CLICK / TOUCH FUERA
   * ==========================================================
   */

  useEffect(() => {
    function cerrarFuera(
      event: PointerEvent
    ) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(
          event.target as Node
        )
      ) {
        setAbierto(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      cerrarFuera
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        cerrarFuera
      );
    };
  }, []);

  /*
   * ==========================================================
   * ESCAPE
   * ==========================================================
   */

  useEffect(() => {
    function cerrarConEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setAbierto(false);
      }
    }

    window.addEventListener(
      "keydown",
      cerrarConEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, []);

  /*
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  async function cerrarSesion() {
    if (cerrandoSesion) {
      return;
    }

    try {
      setCerrandoSesion(
        true
      );

      setAbierto(false);

      await signOut({
        callbackUrl:
          "/login",
      });
    } finally {
      setCerrandoSesion(
        false
      );
    }
  }

  return (
    <div
      ref={contenedorRef}
      className="relative"
    >
      {/* ==================================================== */}
      {/* BOTÓN */}
      {/* ==================================================== */}

      <button
        type="button"
        onClick={() =>
          setAbierto(
            (actual) =>
              !actual
          )
        }
        disabled={
          cerrandoSesion
        }
        aria-label="Abrir menú de cuenta"
        aria-haspopup="menu"
        aria-expanded={
          abierto
        }
        aria-controls="account-menu-dropdown"
        className={`group flex min-h-11 items-center rounded-xl border bg-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          abierto
            ? "border-emerald-200 ring-4 ring-emerald-500/10"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {/* AVATAR */}

        <div className="m-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
          {avatarUrl &&
          !avatarError ? (
            <img
              src={avatarUrl}
              alt={`Avatar de ${name}`}
              className="h-full w-full object-cover"
              onError={() =>
                setAvatarError(
                  true
                )
              }
            />
          ) : (
            iniciales
          )}
        </div>

        {/* DATOS DESKTOP */}

        <div className="hidden min-w-0 py-1 pl-1 text-left sm:block">
          <p className="max-w-32 truncate text-sm font-bold leading-5 text-slate-900 lg:max-w-40">
            {name}
          </p>

          <p className="max-w-32 truncate text-[11px] leading-4 text-slate-400 lg:max-w-40">
            {roleLabel}
          </p>
        </div>

        {/* FLECHA */}

        <div className="hidden h-10 w-9 shrink-0 items-center justify-center sm:flex">
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${
              abierto
                ? "rotate-180"
                : ""
            }`}
          />
        </div>
      </button>

      {/* ==================================================== */}
      {/* DROPDOWN */}
      {/* ==================================================== */}

      {abierto && (
        <div
          id="account-menu-dropdown"
          role="menu"
          className="absolute right-0 z-[70] mt-2 w-[calc(100vw-2rem)] max-w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        >
          {/* ================================================= */}
          {/* USUARIO */}
          {/* ================================================= */}

          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">
                {avatarUrl &&
                !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={`Avatar de ${name}`}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setAvatarError(
                        true
                      )
                    }
                  />
                ) : (
                  iniciales
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {name}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {email}
                </p>

                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* NAVEGACIÓN */}
          {/* ================================================= */}

          <div className="p-2">
            <Link
              href={
                dashboardHref
              }
              role="menuitem"
              onClick={() =>
                setAbierto(false)
              }
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <LayoutDashboard
                  size={16}
                />
              </div>

              <span>
                Dashboard
              </span>
            </Link>

            <Link
              href="/perfil"
              role="menuitem"
              onClick={() =>
                setAbierto(false)
              }
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <UserRound
                  size={16}
                />
              </div>

              <div>
                <p>
                  Mi perfil
                </p>

                <p className="text-[11px] font-normal text-slate-400">
                  Datos y fotografía
                </p>
              </div>
            </Link>

            <Link
              href="/perfil/seguridad"
              role="menuitem"
              onClick={() =>
                setAbierto(false)
              }
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <ShieldCheck
                  size={16}
                />
              </div>

              <div>
                <p>
                  Seguridad
                </p>

                <p className="text-[11px] font-normal text-slate-400">
                  Contraseña y acceso
                </p>
              </div>
            </Link>

            {/* SOLO CLIENTE */}

            {!esEntrenador && (
              <Link
                href="/client/fuerza"
                role="menuitem"
                onClick={() =>
                  setAbierto(false)
                }
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  <Dumbbell
                    size={16}
                  />
                </div>

                <div>
                  <p>
                    Mi fuerza
                  </p>

                  <p className="text-[11px] font-normal text-slate-400">
                    Récords y progreso
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* ================================================= */}
          {/* LOGOUT */}
          {/* ================================================= */}

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              role="menuitem"
              disabled={
                cerrandoSesion
              }
              onClick={
                cerrarSesion
              }
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                {cerrandoSesion ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={16}
                  />
                )}
              </div>

              {cerrandoSesion
                ? "Cerrando sesión..."
                : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}