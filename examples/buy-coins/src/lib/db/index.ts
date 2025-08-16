import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    try {
        // --- Determine project root for the buy-coins example ---
        // We want a stable path even when bundled by Next.js (where __dirname points into .next)
        const cwd = process.cwd();
        const exampleSegment = path.join("examples", "buy-coins");
        let projectRoot: string | null = null;
        if (cwd.includes(exampleSegment)) {
            projectRoot = cwd.slice(
                0,
                cwd.indexOf(exampleSegment) + exampleSegment.length
            );
        } else {
            // Walk upwards from __dirname to find package.json with name === 'buy-coins'
            let probe = __dirname;
            for (let i = 0; i < 8; i++) {
                // limit depth
                const pkgPath = path.join(probe, "package.json");
                try {
                    if (fs.existsSync(pkgPath)) {
                        const pkg = JSON.parse(
                            fs.readFileSync(pkgPath, "utf8")
                        );
                        if (pkg.name === "buy-coins") {
                            projectRoot = probe;
                            break;
                        }
                    }
                } catch {
                    /* ignore */
                }
                const parent = path.dirname(probe);
                if (parent === probe) break;
                probe = parent;
            }
        }
        // Fallback: assume monorepo root + examples/buy-coins
        if (!projectRoot) {
            projectRoot = path.join(cwd, exampleSegment);
        }

        // Absolute path to the db directory with schema + migrations
        const dbDir = path.join(projectRoot, "src", "lib", "db");
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

        const dbPath = path.join(dbDir, "local.db");

        // Create libsql client for local SQLite file
        const client = createClient({
            url: `file:${dbPath}`,
        });

        dbInstance = drizzle(client, { schema });

        // Treat undefined NODE_ENV as development; only skip in explicit production
        const isDevLike = process.env.NODE_ENV !== "production";
        if (isDevLike) {
            try {
                // Candidate migration folders (first existing wins)
                const candidatePaths = [
                    path.join(dbDir, "migrations"),
                    path.join(projectRoot, "migrations"),
                    path.join(projectRoot, "src", "lib", "db", "migrations"),
                ];
                const migrationsPath = candidatePaths.find((p) =>
                    fs.existsSync(p)
                );
                if (migrationsPath) {
                    migrate(dbInstance, { migrationsFolder: migrationsPath });
                    console.log(
                        "✅ Database migrations completed (" +
                            migrationsPath +
                            ")"
                    );
                } else {
                    console.warn(
                        "⚠️ Migrations folder not found in candidates:",
                        candidatePaths
                    );
                }
            } catch (error) {
                console.warn("⚠️ Database migrations failed:", error);
            }
        }

        console.log("✅ Database connected successfully");
        return dbInstance;
    } catch (error) {
        console.error("❌ Failed to connect to database:", error);
        throw error;
    }
}

export const getDb = () => initializeDatabase();
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(target, prop) {
        const database = initializeDatabase();
        return database[prop as keyof typeof database];
    },
});

export { schema };
export type { User, NewUser, Transaction, NewTransaction } from "./schema";
