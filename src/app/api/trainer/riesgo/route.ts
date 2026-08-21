import {
  requireApiTrainer,
} from "@/lib/api-auth";

import {
  obtenerRiesgoClientesEntrenador,
} from "@/lib/trainer-risk-data";

export async function GET() {
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  try {
    const data =
      await obtenerRiesgoClientesEntrenador(
        acceso.user.id
      );

    return Response.json(
      data
    );
  } catch (error) {
    console.error(
      "Error calculando riesgo de clientes:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo analizar el estado de los clientes.",
      },
      {
        status: 500,
      }
    );
  }
}