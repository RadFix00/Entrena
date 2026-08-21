import nodemailer from "nodemailer";

type ResetPasswordEmail = {
  to: string;
  name: string;
  resetUrl: string;
};

function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export async function enviarCorreoRecuperacion({
  to,
  name,
  resetUrl,
}: ResetPasswordEmail) {
  /*
   * ============================================
   * DESARROLLO
   * ============================================
   *
   * Mientras no configuremos SMTP,
   * Entrena mostrará el enlace en la terminal.
   */

  if (!smtpConfigurado()) {
    if (process.env.NODE_ENV !== "production") {
      console.log("");
      console.log("======================================");
      console.log("ENTRENA - RECUPERACIÓN DE CONTRASEÑA");
      console.log(`Usuario: ${to}`);
      console.log(`URL: ${resetUrl}`);
      console.log("======================================");
      console.log("");

      return;
    }

    throw new Error("SMTP no está configurado.");
  }

  const port = Number(process.env.SMTP_PORT);

  const secure =
    process.env.SMTP_SECURE === "true" ||
    port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from =
    process.env.MAIL_FROM ??
    `Entrena <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to,

    subject: "Recupera tu contraseña de Entrena",

    text: `
Hola ${name},

Recibimos una solicitud para recuperar tu contraseña de Entrena.

Usa este enlace:

${resetUrl}

El enlace expirará en 30 minutos y solamente podrá utilizarse una vez.

Si tú no solicitaste este cambio, ignora este correo.

Entrena
    `.trim(),

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 560px;
        margin: 0 auto;
        padding: 32px;
        color: #0f172a;
      ">
        <h1 style="
          margin: 0 0 16px;
          font-size: 26px;
        ">
          Recupera tu contraseña
        </h1>

        <p style="
          color: #475569;
          line-height: 1.6;
        ">
          Hola ${escapeHtml(name)}.
        </p>

        <p style="
          color: #475569;
          line-height: 1.6;
        ">
          Recibimos una solicitud para restablecer tu contraseña de Entrena.
        </p>

        <div style="margin: 28px 0;">
          <a
            href="${escapeHtml(resetUrl)}"
            style="
              display: inline-block;
              padding: 13px 20px;
              border-radius: 10px;
              background: #059669;
              color: #ffffff;
              text-decoration: none;
              font-weight: 700;
            "
          >
            Cambiar contraseña
          </a>
        </div>

        <p style="
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        ">
          Este enlace expirará en 30 minutos y solo podrá utilizarse una vez.
        </p>

        <p style="
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        ">
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => {
      const replacements: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return replacements[character];
    }
  );
}