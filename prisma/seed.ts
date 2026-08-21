import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Iniciando seed de Entrena...");

  const trainer = await prisma.user.upsert({
    where: {
      email: "entrenador@entrena.com",
    },
    update: {
      name: "Entrenador Entrena",
      role: "TRAINER",
    },
    create: {
      name: "Entrenador Entrena",
      email: "entrenador@entrena.com",
      role: "TRAINER",
    },
  });

  const clientes = [
    {
      name: "María López",
      email: "maria@ejemplo.com",
      phone: "+57 300 123 4567",
      goal: "Ganancia de masa muscular",
      currentWeightKg: "63.20",
      startWeightKg: "61.80",
      status: "ACTIVE" as const,
    },
    {
      name: "Andrés Pérez",
      email: "andres@ejemplo.com",
      phone: "+57 301 222 4455",
      goal: "Aumentar fuerza",
      currentWeightKg: "82.40",
      startWeightKg: "82.80",
      status: "ACTIVE" as const,
    },
    {
      name: "Laura Gómez",
      email: "laura@ejemplo.com",
      phone: "+57 302 555 1122",
      goal: "Recomposición corporal",
      currentWeightKg: "58.60",
      startWeightKg: "60.10",
      status: "ACTIVE" as const,
    },
    {
      name: "Daniel Rojas",
      email: "daniel@ejemplo.com",
      phone: "+57 310 444 8899",
      goal: "Pérdida de grasa",
      currentWeightKg: "91.40",
      startWeightKg: "94.20",
      status: "REVIEW" as const,
    },
  ];

  for (const data of clientes) {
    const cliente = await prisma.user.upsert({
      where: {
        email: data.email,
      },
      update: {
        name: data.name,
        role: "CLIENT",
      },
      create: {
        name: data.name,
        email: data.email,
        role: "CLIENT",
      },
    });

    await prisma.profile.upsert({
      where: {
        userId: cliente.id,
      },
      update: {
        phone: data.phone,
        goal: data.goal,
        currentWeightKg: data.currentWeightKg,
        startWeightKg: data.startWeightKg,
      },
      create: {
        userId: cliente.id,
        phone: data.phone,
        goal: data.goal,
        currentWeightKg: data.currentWeightKg,
        startWeightKg: data.startWeightKg,
      },
    });

    await prisma.trainerClient.upsert({
      where: {
        trainerId_clientId: {
          trainerId: trainer.id,
          clientId: cliente.id,
        },
      },
      update: {
        status: data.status,
      },
      create: {
        trainerId: trainer.id,
        clientId: cliente.id,
        status: data.status,
      },
    });
  }

  const ejercicios = [
    {
      name: "Sentadilla con barra",
      muscleGroup: "Piernas",
    },
    {
      name: "Prensa inclinada",
      muscleGroup: "Piernas",
    },
    {
      name: "Extensión de cuádriceps",
      muscleGroup: "Piernas",
    },
    {
      name: "Press banca",
      muscleGroup: "Pecho",
    },
    {
      name: "Remo con barra",
      muscleGroup: "Espalda",
    },
    {
      name: "Elevaciones laterales",
      muscleGroup: "Hombros",
    },
    {
      name: "Peso muerto rumano",
      muscleGroup: "Piernas",
    },
    {
      name: "Hip thrust",
      muscleGroup: "Glúteos",
    },
  ];

  for (const ejercicio of ejercicios) {
    await prisma.exercise.upsert({
      where: {
        trainerId_name: {
          trainerId: trainer.id,
          name: ejercicio.name,
        },
      },
      update: {
        muscleGroup: ejercicio.muscleGroup,
      },
      create: {
        trainerId: trainer.id,
        name: ejercicio.name,
        muscleGroup: ejercicio.muscleGroup,
      },
    });
  }

  console.log("Seed de Entrena completado correctamente.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Error ejecutando seed:");
    console.error(error);

    await prisma.$disconnect();
    await pool.end();

    process.exit(1);
  });