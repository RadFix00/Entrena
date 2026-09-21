import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /*
   * Permite acceder al dev server desde otros equipos
   * de la red local (p. ej. http://192.168.10.5:3000).
   * Sin esto, Next.js responde 403 a los chunks JS y
   * la página no hidrata, por lo que el login no funciona.
   */
  allowedDevOrigins: ["192.168.10.5"],
};

export default nextConfig;
