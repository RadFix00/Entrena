import { requireClient } from "@/lib/auth-user";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Sin sesión:
   *   → /login
   *
   * TRAINER:
   *   → /trainer/dashboard
   *
   * CLIENT:
   *   → continúa
   */
  await requireClient();

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}