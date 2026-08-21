type Props = {
  name: string;
  avatarUrl?: string | null;

  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl";

  className?: string;
};

function obtenerIniciales(
  nombre: string
) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (parte) =>
        parte[0]
    )
    .join("")
    .toUpperCase();
}

const tamanos = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-lg",
};

export default function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: Props) {
  const iniciales =
    obtenerIniciales(
      name
    );

  return (
    <div
      className={`
        shrink-0 overflow-hidden rounded-full
        bg-emerald-100 font-bold text-emerald-700
        ring-1 ring-slate-200
        ${tamanos[size]}
        ${className}
      `}
    >
      {avatarUrl ? (
        <img
          src={
            avatarUrl
          }
          alt={`Foto de ${name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {iniciales}
        </div>
      )}
    </div>
  );
}