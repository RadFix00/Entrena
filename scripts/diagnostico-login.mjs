import "dotenv/config";
import pg from "pg";
import { compare } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const pool = new pg.Pool({ connectionString });

const emailArg = process.argv[2] ?? "entrenador@entrena.com";
const passwordArg = process.argv[3] ?? "Entrena123!";

const email = emailArg.trim().toLowerCase();

console.log("=== DIAGNÓSTICO LOGIN (BD) ===");
console.log("Email probado:", email);

const { rows } = await pool.query(
  'SELECT id, name, email, role, "passwordHash", "sessionVersion" FROM "User" WHERE email = $1',
  [email]
);

if (rows.length === 0) {
  console.log("❌ Usuario NO existe en la BD.");
  const all = await pool.query(
    'SELECT email, role, ("passwordHash" IS NOT NULL) AS has_hash FROM "User" ORDER BY email ASC'
  );
  console.log("\nUsuarios existentes:");
  for (const u of all.rows) {
    console.log(` - ${u.email} (${u.role}) hash=${u.has_hash ? "sí" : "NO"}`);
  }
  await pool.end();
  process.exit(0);
}

const user = rows[0];
console.log("✅ Usuario existe:", user.email, "| rol:", user.role);
console.log("   passwordHash:", user.passwordHash ? "presente" : "AUSENTE ❌");
console.log("   sessionVersion:", user.sessionVersion);

if (!user.passwordHash) {
  console.log("❌ El usuario no tiene contraseña asignada.");
  console.log("   Ejecuta: npx tsx prisma/set-dev-passwords.ts (o el equivalente)");
  await pool.end();
  process.exit(0);
}

const ok = await compare(passwordArg, user.passwordHash);
console.log(
  ok
    ? "✅ La contraseña COINCIDE con el hash almacenado."
    : "❌ La contraseña NO coincide con el hash."
);

await pool.end();
