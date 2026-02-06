import { env } from "../packages/config/src/index";

console.log("🔍 Testing S1: Environment Verification...");
console.log("✅ Environment validated successfully!");
console.log("Current NODE_ENV:", env.NODE_ENV);
console.log("Database URL present:", !!env.DATABASE_URL);
