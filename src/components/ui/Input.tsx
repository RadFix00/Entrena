import {
  forwardRef,
} from "react";

import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

type Props =
  InputHTMLAttributes<HTMLInputElement> & {
    /*
     * Icono a la izquierda del input
     * (p. ej. Mail, Search, Lock).
     */
    leftIcon?: ReactNode;

    /*
     * Elemento opcional a la derecha
     * (p. ej. botón de mostrar/ocultar).
     */
    rightElement?: ReactNode;
  };

const Input = forwardRef<
  HTMLInputElement,
  Props
>(function Input(
  {
    leftIcon,
    rightElement,
    className = "",
    ...props
  },
  ref
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {leftIcon}
        </span>
      )}

      <input
        ref={ref}
        className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          leftIcon
            ? "pl-10"
            : "px-3"
        } ${
          rightElement
            ? "pr-12"
            : "pr-4"
        } ${className}`}
        {...props}
      />

      {rightElement}
    </div>
  );
});

export default Input;
