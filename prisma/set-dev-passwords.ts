import "dotenv/config";

import {
  hash,
} from "bcryptjs";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "../src/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está definida"
  );
}

const adapter =
  new PrismaPg({
    connectionString,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

async function main() {
  /*
   * Contraseñas SOLO para desarrollo.
   */
  const trainerHash =
    await hash(
      "Entrena123!",
      12
    );

  const clientHash =
    await hash(
      "Cliente123!",
      12
    );

  await prisma.user.update({
    where: {
      email:
        "entrenador@entrena.com",
    },

    data: {
      passwordHash:
        trainerHash,
    },
  });

  const clientes = [
    "maria@ejemplo.com",
    "andres@ejemplo.com",
    "laura@ejemplo.com",
    "daniel@ejemplo.com",
  ];

  for (
    const email of clientes
  ) {
    await prisma.user.update({
      where: {
        email,
      },

      data: {
        passwordHash:
          clientHash,
      },
    });
  }

  console.log(
    "Contraseñas de desarrollo configuradas."
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });