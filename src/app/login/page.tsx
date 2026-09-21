"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  signIn,
} from "next-auth/react";

import {
  useRouter,
} from "next/navigation";

import {
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";

export default function LoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Muestra confirmación si venimos
   * de cambiar o restablecer la contraseña.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "passwordChanged"
      ) === "1"
    ) {
      setSuccess(
        "Tu contraseña fue actualizada. Vuelve a iniciar sesión."
      );
    } else if (
      params.get("reset") ===
      "success"
    ) {
      setSuccess(
        "Tu contraseña fue restablecida. Ya puedes iniciar sesión."
      );
    }
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (cargando) {
      return;
    }

    try {
      setCargando(true);
      setError("");

      const emailLimpio =
        email
          .trim()
          .toLowerCase();

      const resultado =
        await signIn(
          "credentials",
          {
            email:
              emailLimpio,

            password,

            redirect: false,
          }
        );

      if (
        !resultado ||
        resultado.error
      ) {
        setError(
          "Correo o contraseña incorrectos."
        );

        return;
      }

      router.replace(
        "/auth/redirect"
      );

      router.refresh();
    } catch {
      setError(
        "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* LOGO */}

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Dumbbell
              size={27}
            />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Entrena
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Accede a tu cuenta
          </p>
        </div>

        {/* CARD */}

        <Card className="p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Introduce tus credenciales
              para continuar.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6 space-y-5"
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Correo electrónico
              </label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                disabled={
                  cargando
                }
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="correo@ejemplo.com"
                leftIcon={
                  <Mail
                    size={18}
                  />
                }
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Input
                id="password"
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                required
                disabled={
                  cargando
                }
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                placeholder="Tu contraseña"
                leftIcon={
                  <LockKeyhole
                    size={18}
                  />
                }
                rightElement={
                  <button
                    type="button"
                    disabled={
                      cargando
                    }
                    onClick={() =>
                      setMostrarPassword(
                        (actual) =>
                          !actual
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}
                  </button>
                }
              />
            </div>

            {/* MENSAJES */}

            {success && (
              <Alert variant="success">
                {success}
              </Alert>
            )}

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            {/* BOTÓN */}

            <Button
              type="submit"
              loading={
                cargando
              }
              className="w-full"
            >
              {cargando
                ? "Ingresando..."
                : "Iniciar sesión"}
            </Button>
          </form>
        </Card>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-slate-400">
          Entrena · Plataforma de entrenamiento
        </p>
      </div>
    </main>
  );
}
