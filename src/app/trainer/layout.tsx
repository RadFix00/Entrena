import TrainerSidebar from "@/components/trainer/TrainerSidebar";
import AccountMenuServer from "@/components/account/AccountMenuServer";

import {
  requireTrainer,
} from "@/lib/auth-user";

export default async function TrainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Si no existe sesión:
   * → /login
   *
   * Si es CLIENT:
   * → /client/dashboard
   *
   * Si es TRAINER / ADMIN:
   * → continúa
   */
  await requireTrainer();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* SIDEBAR */}

      <TrainerSidebar />

      {/* CONTENIDO PRINCIPAL */}

      <div className="min-w-0 flex-1">
        {/* BARRA SUPERIOR */}

        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-end px-4 sm:px-6 lg:px-8">
            <AccountMenuServer />
          </div>
        </header>

        {/* PÁGINAS */}

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}