"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronDown,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  signOut,
} from "next-auth/react";

type Props = {
  name: string;

  email: string;

  avatarUrl:
    | string
    | null;

  role: string;
};

function obtenerIniciales(
  name: string
) {
  const partes =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    partes.length === 0
  ) {
    return "U";
  }

  if (
    partes.length === 1
  ) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    partes[0][0] +
    partes[
      partes.length - 1
    ][0]
  ).toUpperCase();
}

export default function AccountMenu({
  name,
  email,
  avatarUrl,
  role,
}: Props) {
  const [
    abierto,
    setAbierto,
  ] =
    useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] =
    useState(false);

  const [
    avatarError,
    setAvatarError,
  ] =
    useState(false);

  const contenedorRef =
    useRef<HTMLDivElement>(
      null
    );

  const esEntrenador =
    role ===
      "TRAINER" ||
    role ===
      "ADMIN";

  const dashboardHref =
    esEntrenador
      ? "/trainer/dashboard"
      : "/client/dashboard";

  const iniciales =
    obtenerIniciales(
      name
    );

  /*
   * Cerrar cuando se hace clic
   * fuera del menú.
   */
  useEffect(() => {
    function cerrarFuera(
      event:
        MouseEvent
    ) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(
          event.target as Node
        )
      ) {
        setAbierto(
          false
        );
      }
    }

    document.addEventListener(
      "mousedown",
      cerrarFuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarFuera
      );
    };
  }, []);

  /*
   * Cerrar con ESC.
   */
  useEffect(() => {
    function escape(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setAbierto(
          false
        );
      }
    }

    window.addEventListener(
      "keydown",
      escape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        escape
      );
    };
  }, []);

  async function cerrarSesion() {
    try {
      setCerrandoSesion(
        true
      );

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
      ref={
        contenedorRef
      }
      className="relative"
    >
      {/* BOTÓN */}

      <button
        type="button"
        onClick={() =>
          setAbierto(
            (actual) =>
              !actual
          )
        }
        className="flex max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:bg-slate-50"
        aria-expanded={
          abierto
        }
      >
        {/* AVATAR */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
          {avatarUrl &&
          !avatarError ? (
            <img
              src={
                avatarUrl
              }
              alt=""
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

        {/* DATOS */}

        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-36 truncate text-sm font-bold text-slate-900">
            {name}
          </p>

          <p className="max-w-36 truncate text-[11px] text-slate-400">
            {esEntrenador
              ? "Entrenador"
              : "Cliente"}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`hidden shrink-0 text-slate-400 transition sm:block ${
            abierto
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {/* MENÚ */}

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* USUARIO */}

          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                {avatarUrl &&
                !avatarError ? (
                  <img
                    src={
                      avatarUrl
                    }
                    alt=""
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

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {name}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* LINKS */}

          <div className="p-2">
            <Link
              href={
                dashboardHref
              }
              onClick={() =>
                setAbierto(
                  false
                )
              }
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LayoutDashboard
                size={17}
              />

              Dashboard
            </Link>

            <Link
              href="/perfil"
              onClick={() =>
                setAbierto(
                  false
                )
              }
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <UserRound
                size={17}
              />

              Mi perfil
            </Link>

            <Link
            href="/perfil/seguridad"
            onClick={() =>
                setAbierto(false)
            }
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
            <ShieldCheck
                size={17}
            />

            Seguridad
            </Link>

            {!esEntrenador && (
              <Link
                href="/client/fuerza"
                onClick={() =>
                  setAbierto(
                    false
                  )
                }
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Dumbbell
                  size={17}
                />

                Mi fuerza
              </Link>
            )}
          </div>

          {/* LOGOUT */}

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              disabled={
                cerrandoSesion
              }
              onClick={
                cerrarSesion
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut
                size={17}
              />

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