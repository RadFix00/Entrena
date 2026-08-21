"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Play,
} from "lucide-react";

type Props = {
  workoutDayId: string;
};

export default function StartWorkoutButton({
  workoutDayId,
}: Props) {
  const router =
    useRouter();

  const [
    iniciando,
    setIniciando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function iniciar() {
    try {
      setIniciando(true);
      setError("");

      const response =
        await fetch(
          "/api/client/workouts/start",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                workoutDayId,
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          sessionId?: string;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo iniciar el entrenamiento."
        );
      }

      if (!data.sessionId) {
        throw new Error(
          "No se recibió la sesión de entrenamiento."
        );
      }

      router.push(
        `/client/entrenamientos/${data.sessionId}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar."
      );
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={iniciar}
        disabled={iniciando}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Play
          size={18}
          fill="currentColor"
        />

        {iniciando
          ? "Iniciando..."
          : "Iniciar entrenamiento"}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}