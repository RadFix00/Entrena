import { auth } from "@/auth";

export async function requireApiUser() {
  const session =
    await auth();

  if (!session?.user) {
    return {
      ok: false as const,

      response: Response.json(
        {
          error:
            "No autenticado.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  return {
    ok: true as const,
    user: session.user,
  };
}

export async function requireApiTrainer() {
  const acceso =
    await requireApiUser();

  if (!acceso.ok) {
    return acceso;
  }

  if (
    acceso.user.role !==
      "TRAINER" &&
    acceso.user.role !==
      "ADMIN"
  ) {
    return {
      ok: false as const,

      response: Response.json(
        {
          error:
            "No tienes permisos de entrenador.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return acceso;
}

export async function requireApiClient() {
  const acceso =
    await requireApiUser();

  if (!acceso.ok) {
    return acceso;
  }

  if (
    acceso.user.role !==
      "CLIENT" &&
    acceso.user.role !==
      "ADMIN"
  ) {
    return {
      ok: false as const,

      response: Response.json(
        {
          error:
            "No tienes permisos de cliente.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return acceso;
}