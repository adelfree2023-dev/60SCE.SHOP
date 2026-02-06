import type { Config } from "drizzle-kit";

export default {
    schema: "./src/schema/index.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://apex:@127.0.0.1:5432/apex_v2",
    },
} satisfies Config;
