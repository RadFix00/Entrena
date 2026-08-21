import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) =>
      email.trim().toLowerCase()
    ),

  password: z
    .string()
    .min(8)
    .max(72),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  /*
   * Como estamos usando email + contraseña,
   * utilizaremos una sesión JWT.
   *
   * Auth.js cifra el JWT utilizando
   * AUTH_SECRET.
   */
  session: {
    strategy: "jwt",

    maxAge:
      7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Correo",
          type: "email",
        },

        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(
        credentials
      ) {
        const resultado =
          credentialsSchema.safeParse(
            credentials
          );

        if (!resultado.success) {
          return null;
        }

        const {
          email,
          password,
        } = resultado.data;

        /*
         * Buscamos al usuario en PostgreSQL.
         */
        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },

            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              role: true,
            },
          });

        /*
         * No revelamos si falló el correo
         * o la contraseña.
         */
        if (
          !user ||
          !user.passwordHash
        ) {
          return null;
        }

        const passwordCorrecto =
          await compare(
            password,
            user.passwordHash
          );

        if (!passwordCorrecto) {
          return null;
        }

        return {
          id: user.id,

          name: user.name,

          email: user.email,

          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    /*
     * Cuando se crea el JWT guardamos
     * únicamente lo necesario:
     *
     * user ID
     * role
     */
    async jwt({
      token,
      user,
    }) {
      if (user) {
        token.id = user.id;

        token.role =
          user.role;
      }

      return token;
    },

    /*
     * Exponemos ID y rol a la sesión.
     */
    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id =
          token.id;

        session.user.role =
          token.role;
      }

      return session;
    },
  },
});