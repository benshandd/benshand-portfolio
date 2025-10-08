import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/env/server";
import * as schema from "./schema";

const connectionString = serverEnv.DATABASE_URL;

const client = postgres(connectionString, {
  ssl: connectionString.includes("localhost") ? undefined : "require",
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
