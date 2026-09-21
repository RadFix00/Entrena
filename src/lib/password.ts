export type PasswordRequirement = {
  label: string;
  completed: boolean;
};

/*
 * Requisitos de contraseña compartidos por
 * los formularios de registro y cambio.
 */
export function calcularRequisitosPassword(
  password: string
): PasswordRequirement[] {
  return [
    {
      label:
        "Mínimo 8 caracteres",

      completed:
        password.length >= 8,
    },

    {
      label:
        "Una mayúscula",

      completed:
        /[A-Z]/.test(
          password
        ),
    },

    {
      label:
        "Una minúscula",

      completed:
        /[a-z]/.test(
          password
        ),
    },

    {
      label:
        "Un número",

      completed:
        /\d/.test(
          password
        ),
    },
  ];
}
