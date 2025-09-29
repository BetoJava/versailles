
import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `drouaire_${name}`);

export const users = createTable(
  "user",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey(), // ID de Cognito (sub)
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    email: d.varchar({ length: 255 }).notNull().unique(),
    familyName: d.varchar({ length: 100 }),
    givenName: d.varchar({ length: 100 }),
    optimizationRegime: d.varchar({ length: 50 }),
    telephone: d.varchar({ length: 20 }),
  }),
  (t) => [
    index("users_email_idx").on(t.email),
  ],
);
