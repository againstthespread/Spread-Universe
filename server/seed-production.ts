import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

export async function seedProductionIfEmpty() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT COUNT(*) as cnt FROM marchmadness_teams");
    const teamCount = parseInt(result.rows[0].cnt, 10);

    if (teamCount > 0) {
      console.log(`Database already has ${teamCount} teams, skipping seed.`);
      return;
    }

    console.log("Production database is empty, seeding data...");

    const candidates = [
      path.join(process.cwd(), "dist", "seed-data.sql"),
      path.join(process.cwd(), "server", "seed-data.sql"),
    ];

    let sqlContent: string | null = null;
    for (const p of candidates) {
      try {
        sqlContent = fs.readFileSync(p, "utf-8");
        console.log(`Found seed file at: ${p}`);
        break;
      } catch {}
    }

    if (!sqlContent) {
      console.error("No seed-data.sql file found, skipping seed.");
      return;
    }

    const statements = sqlContent
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("INSERT"));

    await client.query("BEGIN");

    try {
      await client.query("DELETE FROM marchmadness_rounds");
      console.log("Cleared auto-initialized rounds to avoid conflicts.");

      let executed = 0;

      for (const stmt of statements) {
        await client.query(stmt);
        executed++;
      }

      await client.query("COMMIT");
      console.log(`Seed complete: ${executed} statements executed successfully.`);
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.error("Seed failed, transaction rolled back:", e.message);
      throw e;
    }
  } catch (error) {
    console.error("Seed check failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}
