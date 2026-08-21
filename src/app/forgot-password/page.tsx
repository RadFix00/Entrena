import Link from "next/link";

import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import ForgotPasswordForm from "@/components/account/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <KeyRound size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Recuperar contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa el correo asociado a tu cuenta.
              Si existe en Entrena, recibirás un enlace
              para crear una nueva contraseña.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <ForgotPasswordForm />
          </div>

          <div className="flex items-start gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-8">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <p className="text-xs leading-5 text-slate-500">
              Por seguridad, Entrena no indicará si el
              correo introducido pertenece o no a una
              cuenta registrada.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}