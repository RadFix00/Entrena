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
  await requireTrainer();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar desktop + drawer mobile */}

      <TrainerSidebar />

      {/* Área principal */}

      <div className="min-w-0 flex-1">
        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between px-4 sm:px-6 lg:justify-end lg:px-8">
            {/*
             * En móvil dejamos espacio reservado
             * para hamburguesa + logo del sidebar.
             */}

            <div
              className="h-10 w-28 sm:w-40 lg:hidden"
              aria-hidden="true"
            />

            {/* Cuenta */}

            <div className="ml-auto shrink-0">
              <AccountMenuServer />
            </div>
          </div>
        </header>

        {/* ====================================== */}
        {/* CONTENIDO */}
        {/* ====================================== */}

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}