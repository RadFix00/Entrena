import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

import ResetPasswordForm from "@/components/account/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}) {
  const params = await searchParams;

  const token =
    typeof params.token === "string"
      ? params.token
      : "";

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle size={22} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Enlace inválido
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            El enlace de recuperación no contiene
            un token válido.
          </p>

          <Link
            href="/forgot-password"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Solicitar otro enlace
          </Link>
        </section>
      </main>
    );
  }

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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <KeyRound size={22} />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Crear nueva contraseña
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Define una nueva contraseña segura
            para recuperar el acceso a tu cuenta
            de Entrena.
          </p>

          <div className="mt-7">
            <ResetPasswordForm
              token={token}
            />
          </div>
        </section>
      </div>
    </main>
  );
}