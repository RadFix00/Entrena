import prisma from "@/lib/prisma";

import {
  requireUser,
} from "@/lib/auth-user";

import AccountMenu from "@/components/account/AccountMenu";

export default async function AccountMenuServer() {
  const currentUser =
    await requireUser();

  const usuario =
    await prisma.user.findUnique({
      where: {
        id:
          currentUser.id,
      },

      select: {
        id: true,

        name: true,

        email: true,

        avatarUrl:
          true,

        role: true,
      },
    });

  if (!usuario) {
    return null;
  }

  return (
    <AccountMenu
      name={
        usuario.name
      }
      email={
        usuario.email
      }
      avatarUrl={
        usuario.avatarUrl
      }
      role={
        usuario.role
      }
    />
  );
}