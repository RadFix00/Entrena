import Link from "next/link";

import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  requireUser,
} from "@/lib/auth-user";

import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export default async function SecurityPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/perfil"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver a mi perfil
      </Link>

      {/* HEADER */}

      <header className="mt-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Cuenta
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Seguridad
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra la seguridad de tu cuenta de Entrena.
          </p>
        </div>
      </header>

      {/* CAMBIO PASSWORD */}

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <KeyRound
              size={19}
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Cambiar contraseña
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Primero verificaremos tu contraseña actual antes de permitir el cambio.
            </p>
          </div>
        </div>

        <div className="my-6 border-t border-slate-100" />

        <ChangePasswordForm />
      </section>

      {/* INFO */}

      <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-bold text-blue-900">
          Protección de tu cuenta
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-700">
          Entrena no almacena tu contraseña directamente. La contraseña se transforma en un hash antes de guardarse en la base de datos.
        </p>
      </section>
    </main>
  );
}