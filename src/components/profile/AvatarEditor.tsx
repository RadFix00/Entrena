"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Camera,
  CameraIcon,
  ImageIcon,
  RefreshCcw,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type Props = {
  name: string;

  initialAvatarUrl:
    | string
    | null;
};

type Modo =
  | "menu"
  | "camera"
  | "preview";

type FacingMode =
  | "user"
  | "environment";

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

/*
 * ============================================================
 * CANVAS -> WEBP
 * ============================================================
 */

function canvasToWebP(
  canvas:
    HTMLCanvasElement
): Promise<Blob> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo procesar la imagen."
              )
            );

            return;
          }

          resolve(blob);
        },

        "image/webp",
        0.82
      );
    }
  );
}

/*
 * ============================================================
 * ARCHIVO -> IMAGEN HTML
 * ============================================================
 */

function cargarImagen(
  archivo: Blob
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const url =
        URL.createObjectURL(
          archivo
        );

      const imagen =
        new Image();

      imagen.onload =
        () => {
          URL.revokeObjectURL(
            url
          );

          resolve(
            imagen
          );
        };

      imagen.onerror =
        () => {
          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "No se pudo abrir la imagen."
            )
          );
        };

      imagen.src =
        url;
    }
  );
}

/*
 * ============================================================
 * GALERÍA -> CUADRADO 512
 * ============================================================
 */

async function prepararImagen(
  archivo: Blob
) {
  const imagen =
    await cargarImagen(
      archivo
    );

  const width =
    imagen.naturalWidth;

  const height =
    imagen.naturalHeight;

  const lado =
    Math.min(
      width,
      height
    );

  const sx =
    (width -
      lado) /
    2;

  const sy =
    (height -
      lado) /
    2;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    512;

  canvas.height =
    512;

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    throw new Error(
      "No se pudo procesar la imagen."
    );
  }

  ctx.drawImage(
    imagen,
    sx,
    sy,
    lado,
    lado,
    0,
    0,
    512,
    512
  );

  return canvasToWebP(
    canvas
  );
}

export default function AvatarEditor({
  name,
  initialAvatarUrl,
}: Props) {
  const router =
    useRouter();

  const videoRef =
    useRef<HTMLVideoElement>(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState(
    initialAvatarUrl
  );

  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    modo,
    setModo,
  ] =
    useState<Modo>(
      "menu"
    );

  const [
    facingMode,
    setFacingMode,
  ] =
    useState<FacingMode>(
      "user"
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    avatarBlob,
    setAvatarBlob,
  ] =
    useState<Blob | null>(
      null
    );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    cameraVersion,
    setCameraVersion,
  ] = useState(0);

  const iniciales =
    obtenerIniciales(
      name
    );

  /*
   * ==========================================================
   * LIMPIAR STREAM
   * ==========================================================
   */

  function detenerCamara() {
    const stream =
      streamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );
    }

    streamRef.current =
      null;

    if (
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null;
    }
  }

  function limpiarPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl(
      null
    );

    setAvatarBlob(
      null
    );
  }

  useEffect(() => {
    if (
      modo !==
        "camera" ||
      !videoRef.current ||
      !streamRef.current
    ) {
      return;
    }

    videoRef.current.srcObject =
      streamRef.current;
  }, [
    modo,
    cameraVersion,
  ]);

  useEffect(() => {
    return () => {
      const stream =
        streamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, []);

  /*
   * ==========================================================
   * ABRIR CÁMARA
   * ==========================================================
   */

  async function iniciarCamara(
    facing:
      FacingMode
  ) {
    setError("");

    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {
      setError(
        "La cámara no está disponible. Usa HTTPS o localhost, o selecciona una imagen de la galería."
      );

      return;
    }

    detenerCamara();

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio:
              false,

            video: {
              facingMode:
                facing,

              width: {
                ideal:
                  1280,
              },

              height: {
                ideal:
                  1280,
              },
            },
          }
        );

      streamRef.current =
        stream;

      setFacingMode(
        facing
      );

      setModo(
        "camera"
      );

      setCameraVersion(
        (actual) =>
          actual + 1
      );
    } catch (error) {
      console.error(
        error
      );

      setModo(
        "menu"
      );

      setError(
        "No pudimos acceder a la cámara. Revisa el permiso del navegador o usa la galería."
      );
    }
  }

  /*
   * ==========================================================
   * CAMBIAR CÁMARA
   * ==========================================================
   */

  async function cambiarCamara() {
    const nuevo:
      FacingMode =
      facingMode ===
      "user"
        ? "environment"
        : "user";

    await iniciarCamara(
      nuevo
    );
  }

  /*
   * ==========================================================
   * CAPTURAR
   * ==========================================================
   */

  async function capturar() {
    const video =
      videoRef.current;

    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setError(
        "La cámara todavía no está lista."
      );

      return;
    }

    try {
      const width =
        video.videoWidth;

      const height =
        video.videoHeight;

      const lado =
        Math.min(
          width,
          height
        );

      const sx =
        (width -
          lado) /
        2;

      const sy =
        (height -
          lado) /
        2;

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        512;

      canvas.height =
        512;

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        throw new Error(
          "No se pudo procesar la fotografía."
        );
      }

      /*
       * En cámara frontal guardamos
       * la imagen como se ve en el espejo.
       */
      if (
        facingMode ===
        "user"
      ) {
        ctx.translate(
          512,
          0
        );

        ctx.scale(
          -1,
          1
        );
      }

      ctx.drawImage(
        video,
        sx,
        sy,
        lado,
        lado,
        0,
        0,
        512,
        512
      );

      const blob =
        await canvasToWebP(
          canvas
        );

      detenerCamara();
      limpiarPreview();

      const url =
        URL.createObjectURL(
          blob
        );

      setAvatarBlob(
        blob
      );

      setPreviewUrl(
        url
      );

      setModo(
        "preview"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo capturar la fotografía."
      );
    }
  }

  /*
   * ==========================================================
   * GALERÍA
   * ==========================================================
   */

  async function seleccionarArchivo(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const archivo =
      event.target
        .files?.[0];

    event.target.value =
      "";

    if (!archivo) {
      return;
    }

    if (
      !archivo.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Selecciona una imagen válida."
      );

      return;
    }

    /*
     * Limitamos el archivo ORIGINAL
     * antes de procesarlo.
     */
    if (
      archivo.size >
      15 * 1024 * 1024
    ) {
      setError(
        "La imagen seleccionada es demasiado grande."
      );

      return;
    }

    try {
      setError("");

      const blob =
        await prepararImagen(
          archivo
        );

      detenerCamara();
      limpiarPreview();

      const url =
        URL.createObjectURL(
          blob
        );

      setAvatarBlob(
        blob
      );

      setPreviewUrl(
        url
      );

      setModo(
        "preview"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo procesar la fotografía."
      );
    }
  }

  /*
   * ==========================================================
   * GUARDAR
   * ==========================================================
   */

  async function guardarAvatar() {
    if (!avatarBlob) {
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        avatarBlob,
        "avatar.webp"
      );

      const response =
        await fetch(
          "/api/profile/avatar",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;

          avatarUrl?: string;

          error?: string;
        };

      if (
        !response.ok ||
        !data.avatarUrl
      ) {
        throw new Error(
          data.error ??
            "No se pudo guardar el avatar."
        );
      }

      setAvatarUrl(
        data.avatarUrl
      );

      cerrar();

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el avatar."
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ==========================================================
   * ELIMINAR
   * ==========================================================
   */

  async function eliminarAvatar() {
    if (!avatarUrl) {
      return;
    }

    if (
      !window.confirm(
        "¿Eliminar tu foto de perfil?"
      )
    ) {
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const response =
        await fetch(
          "/api/profile/avatar",
          {
            method:
              "DELETE",
          }
        );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo eliminar el avatar."
        );
      }

      setAvatarUrl(
        null
      );

      cerrar();

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el avatar."
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ==========================================================
   * MODAL
   * ==========================================================
   */

  function abrir() {
    setError("");
    setModo(
      "menu"
    );
    setAbierto(
      true
    );
  }

  function cerrar() {
    detenerCamara();
    limpiarPreview();

    setError("");
    setModo(
      "menu"
    );
    setAbierto(
      false
    );
  }

  return (
    <>
      {/* AVATAR */}

      <button
        type="button"
        onClick={
          abrir
        }
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-emerald-100 shadow-md outline-none ring-1 ring-slate-200"
        aria-label="Cambiar foto de perfil"
      >
        {avatarUrl ? (
          <img
            src={
              avatarUrl
            }
            alt={`Avatar de ${name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-emerald-700">
            {iniciales ||
              (
                <UserRound
                  size={28}
                />
              )}
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-slate-950/60 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <Camera
            size={15}
          />
        </span>
      </button>

      {/* INPUT GALERÍA */}

      <input
        ref={
          fileInputRef
        }
        type="file"
        accept="image/*"
        className="hidden"
        onChange={
          seleccionarArchivo
        }
      />

      {/* MODAL */}

      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Foto de perfil
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  La imagen se guardará en formato cuadrado.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cerrar
                }
                disabled={
                  guardando
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div className="p-5">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* =============================== */}
              {/* MENÚ */}
              {/* =============================== */}

              {modo ===
                "menu" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      iniciarCamara(
                        "user"
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CameraIcon
                        size={22}
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        Tomar foto
                      </p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Usar la cámara del dispositivo
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <ImageIcon
                        size={22}
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        Elegir de galería
                      </p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Seleccionar una fotografía existente
                      </p>
                    </div>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={
                        eliminarAvatar
                      }
                      disabled={
                        guardando
                      }
                      className="flex w-full items-center gap-4 rounded-2xl border border-red-100 p-4 text-left text-red-700 transition hover:bg-red-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                        <Trash2
                          size={21}
                        />
                      </div>

                      <div>
                        <p className="font-bold">
                          Eliminar foto
                        </p>

                        <p className="mt-0.5 text-sm text-red-500">
                          Volver a mostrar las iniciales
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* =============================== */}
              {/* CÁMARA */}
              {/* =============================== */}

              {modo ===
                "camera" && (
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
                    <video
                      ref={
                        videoRef
                      }
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover ${
                        facingMode ===
                        "user"
                          ? "-scale-x-100"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={
                        cambiarCamara
                      }
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
                      aria-label="Cambiar cámara"
                    >
                      <RefreshCcw
                        size={18}
                      />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={
                        capturar
                      }
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
                      aria-label="Tomar fotografía"
                    >
                      <Camera
                        size={25}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* =============================== */}
              {/* PREVIEW */}
              {/* =============================== */}

              {modo ===
                "preview" &&
                previewUrl && (
                  <div>
                    <div className="mx-auto aspect-square max-w-sm overflow-hidden rounded-3xl bg-slate-100">
                      <img
                        src={
                          previewUrl
                        }
                        alt="Vista previa del avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={
                          guardando
                        }
                        onClick={() => {
                          limpiarPreview();

                          setModo(
                            "menu"
                          );
                        }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <RefreshCcw
                          size={17}
                        />

                        Repetir
                      </button>

                      <button
                        type="button"
                        disabled={
                          guardando
                        }
                        onClick={
                          guardarAvatar
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Save
                          size={18}
                        />

                        {guardando
                          ? "Guardando..."
                          : "Usar foto"}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}