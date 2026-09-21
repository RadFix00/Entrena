import AccountMenuServer from "@/components/account/AccountMenuServer";

import {
  requireClient,
} from "@/lib/auth-user";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Sin sesión:
   * → /login
   *
   * TRAINER:
   * → /trainer/dashboard
   *
   * CLIENT / ADMIN:
   * → continúa
   */
  await requireClient();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ====================================== */}
      {/* BARRA SUPERIOR */}
      {/* ====================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-end px-4 sm:px-6 lg:px-8">
          <AccountMenuServer />
        </div>
      </header>

      {/* ====================================== */}
      {/* CONTENIDO */}
      {/* ====================================== */}

      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}