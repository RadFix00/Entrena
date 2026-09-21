import {
  auth,
} from "@/auth";

import {
  redirect,
} from "next/navigation";

export default async function AuthRedirectPage() {
  const session =
    await auth();

  if (!session?.user) {
    redirect("/login");
  }

  switch (
    session.user.role
  ) {
    case "TRAINER":
      redirect(
        "/trainer/dashboard"
      );

    case "CLIENT":
      redirect(
        "/client/dashboard"
      );

    case "ADMIN":
      /*
       * No existe un panel /admin dedicado todavía.
       * Los administradores acceden al panel del
       * entrenador (requireTrainer también acepta
       * el rol ADMIN).
       */
      redirect(
        "/trainer/dashboard"
      );

    default:
      redirect("/login");
  }
}