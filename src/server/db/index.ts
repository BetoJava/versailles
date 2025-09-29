import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { env } from "~/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL

const sql = neon(connectionString);
export const db = drizzle({ client: sql, schema });
