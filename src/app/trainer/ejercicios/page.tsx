import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import EjerciciosClient, {
  type EjercicioUI,
} from "@/components/trainer/EjerciciosClient";

export default async function EjerciciosPage() {
  /*
   * Temporal hasta implementar autenticación.
   * Después saldrá de la sesión del entrenador.
   */
  const trainer =
  await requireTrainer();

  const ejerciciosDB = await prisma.exercise.findMany({
    where: {
      trainerId: trainer.id,
    },

    orderBy: {
      name: "asc",
    },

    select: {
      id: true,
      name: true,
      description: true,
      muscleGroup: true,
      videoUrl: true,
      createdAt: true,

      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  const ejercicios: EjercicioUI[] = ejerciciosDB.map(
    (ejercicio) => ({
      id: ejercicio.id,
      nombre: ejercicio.name,
      descripcion: ejercicio.description,
      grupoMuscular: ejercicio.muscleGroup,
      videoUrl: ejercicio.videoUrl,
      asignaciones: ejercicio._count.assignments,
      creadoEn: ejercicio.createdAt.toISOString(),
    })
  );

  return (
    <EjerciciosClient ejerciciosIniciales={ejercicios} />
  );
}