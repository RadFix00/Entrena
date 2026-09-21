import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { fechaParaInput } from "@/lib/format";

import EditarClienteClient, {
  type ClienteEditarInicial,
} from "@/components/trainer/EditarClienteClient";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const trainer =
    await requireTrainer();

  const { id } =
    await params;

  /*
   * El cliente tiene que pertenecer
   * al entrenador autenticado.
   */
  const relacion =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId:
            trainer.id,

          clientId:
            id,
        },
      },

      select: {
        status: true,
        notes: true,

        client: {
          select: {
            id: true,
            name: true,
            email: true,

            profile: {
              select: {
                phone: true,
                birthDate: true,
                goal: true,

                heightCm:
                  true,

                startWeightKg:
                  true,

                currentWeightKg:
                  true,
              },
            },
          },
        },
      },
    });

  if (!relacion) {
    notFound();
  }

  const cliente =
    relacion.client;

  const perfil =
    cliente.profile;

  const clienteInicial: ClienteEditarInicial =
    {
      id:
        cliente.id,

      nombre:
        cliente.name,

      email:
        cliente.email,

      telefono:
        perfil?.phone ??
        "",

      fechaNacimiento:
        fechaParaInput(
          perfil?.birthDate ??
            null
        ),

      alturaCm:
        perfil?.heightCm !=
        null
          ? perfil.heightCm.toString()
          : "",

      pesoInicialKg:
        perfil?.startWeightKg !=
        null
          ? perfil.startWeightKg.toString()
          : "",

      pesoActualKg:
        perfil?.currentWeightKg !=
        null
          ? perfil.currentWeightKg.toString()
          : "",

      objetivo:
        perfil?.goal ??
        "",

      estado:
        relacion.status,

      notas:
        relacion.notes ??
        "",
    };

  return (
    <EditarClienteClient
      clienteInicial={
        clienteInicial
      }
    />
  );
}