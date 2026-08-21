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
   * ==========================================================
   * SESIONES JWT
   * ==========================================================
   */

  session: {
    strategy: "jwt",

    maxAge:
      7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  /*
   * ==========================================================
   * PROVIDERS
   * ==========================================================
   */

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
         * ========================================
         * BUSCAR USUARIO
         * ========================================
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

              /*
               * Versión actual de sesiones.
               */
              sessionVersion: true,
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

        /*
         * ========================================
         * VERIFICAR PASSWORD
         * ========================================
         */

        const passwordCorrecto =
          await compare(
            password,
            user.passwordHash
          );

        if (!passwordCorrecto) {
          return null;
        }

        /*
         * ========================================
         * USUARIO AUTENTICADO
         * ========================================
         */

        return {
          id: user.id,

          name: user.name,

          email: user.email,

          role: user.role,

          /*
           * Se copiará posteriormente al JWT.
           */
          sessionVersion:
            user.sessionVersion,
        };
      },
    }),
  ],

  /*
   * ==========================================================
   * CALLBACKS
   * ==========================================================
   */

  callbacks: {
    /*
     * ========================================================
     * JWT
     * ========================================================
     *
     * Se ejecuta al iniciar sesión y cuando Auth.js
     * vuelve a procesar una sesión JWT.
     */

    async jwt({
      token,
      user,
    }) {
      /*
       * ========================================
       * LOGIN NUEVO
       * ========================================
       */

      if (user) {
        token.id =
          user.id;

        token.role =
          user.role;

        /*
         * Auth.js no conoce automáticamente
         * nuestras propiedades personalizadas.
         */

        const sessionVersion =
          "sessionVersion" in user
            ? user.sessionVersion
            : undefined;

        token.sessionVersion =
          typeof sessionVersion ===
          "number"
            ? sessionVersion
            : 0;

        return token;
      }

      /*
       * ========================================
       * SESIÓN EXISTENTE
       * ========================================
       */

      const userId =
        typeof token.id ===
        "string"
          ? token.id
          : typeof token.sub ===
              "string"
            ? token.sub
            : null;

      const tokenSessionVersion =
        typeof token.sessionVersion ===
        "number"
          ? token.sessionVersion
          : null;

      /*
       * Tokens anteriores a esta implementación
       * no tienen sessionVersion.
       *
       * Los invalidamos deliberadamente.
       */
      if (
        !userId ||
        tokenSessionVersion ===
          null
      ) {
        return null;
      }

      /*
       * ========================================
       * VALIDAR CONTRA POSTGRESQL
       * ========================================
       */

      try {
        const currentUser =
          await prisma.user.findUnique({
            where: {
              id: userId,
            },

            select: {
              sessionVersion: true,
              role: true,
            },
          });

        /*
         * Usuario eliminado.
         */
        if (!currentUser) {
          return null;
        }

        /*
         * ======================================
         * INVALIDACIÓN DE SESIÓN
         * ======================================
         *
         * Ejemplo:
         *
         * JWT              = 2
         * PostgreSQL       = 3
         *
         * La sesión pertenece a una versión
         * anterior y deja de ser válida.
         */

        if (
          currentUser.sessionVersion !==
          tokenSessionVersion
        ) {
          return null;
        }

        /*
         * Aprovechamos la consulta para mantener
         * actualizado el rol.
         */
        token.role =
          currentUser.role;

        return token;
      } catch (error) {
        /*
         * Si PostgreSQL tiene un fallo temporal
         * no destruimos inmediatamente la cookie
         * del usuario.
         *
         * Las consultas posteriores a BD
         * igualmente fallarán hasta recuperar
         * la conexión.
         */

        console.error(
          "Error validando sessionVersion:",
          error
        );

        return token;
      }
    },

    /*
     * ========================================================
     * SESSION
     * ========================================================
     */

    async session({
      session,
      token,
    }) {
      if (session.user) {
        if (
          typeof token.id ===
          "string"
        ) {
          session.user.id =
            token.id;
        }

        if (
          token.role ===
            "ADMIN" ||
          token.role ===
            "TRAINER" ||
          token.role ===
            "CLIENT"
        ) {
          session.user.role =
            token.role;
        }
      }

      return session;
    },
  },
});