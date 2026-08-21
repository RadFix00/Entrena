import TrainerSidebar from "@/components/trainer/TrainerSidebar";
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
   * Si es TRAINER:
   * → continúa
   */
  await requireTrainer();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <TrainerSidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}