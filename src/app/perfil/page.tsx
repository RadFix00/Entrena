import Link from "next/link";

import {
  ArrowLeft,
  Camera,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

import AvatarEditor from "@/components/profile/AvatarEditor";

export default async function PerfilPage() {
  const currentUser =
    await requireUser();

  const usuario =
    await prisma.user.findUnique({
      where: {
        id:
          currentUser.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

  if (!usuario) {
    return null;
  }

  const volver =
    usuario.role ===
      "CLIENT"
      ? "/client/dashboard"
      : "/trainer/dashboard";

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href={
          volver
        }
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al dashboard
      </Link>

      <header>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Camera
            size={17}
          />

          Perfil
        </div>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Mi foto de perfil
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Puedes tomar una fotografía con la cámara o seleccionar una desde tu dispositivo.
        </p>
      </header>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AvatarEditor
            name={
              usuario.name
            }
            initialAvatarUrl={
              usuario.avatarUrl
            }
          />

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {
                usuario.name
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                usuario.email
              }
            </p>

            <p className="mt-3 text-xs text-slate-400">
              Pulsa sobre la fotografía para cambiarla.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}