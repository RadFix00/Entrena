import {
  auth,
} from "@/auth";

import {
  redirect,
} from "next/navigation";

export async function getCurrentUser() {
  const session =
    await auth();

  return (
    session?.user ??
    null
  );
}

export async function requireUser() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireTrainer() {
  const user =
    await requireUser();

  if (
    user.role !== "TRAINER" &&
    user.role !== "ADMIN"
  ) {
    redirect(
      "/client/dashboard"
    );
  }

  return user;
}

export async function requireClient() {
  const user =
    await requireUser();

  if (
    user.role !== "CLIENT" &&
    user.role !== "ADMIN"
  ) {
    redirect(
      "/trainer/dashboard"
    );
  }

  return user;
}

export async function requireAdmin() {
  const user =
    await requireUser();

  if (
    user.role !== "ADMIN"
  ) {
    redirect(
      "/auth/redirect"
    );
  }

  return user;
}