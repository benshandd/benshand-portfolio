import "dotenv/config";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

async function main() {
  const emailArg = process.argv[2];
  const passwordArg = process.argv[3];

  const email = (emailArg || process.env.TEST_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = passwordArg || process.env.TEST_ADMIN_PASSWORD || "ChangeMe123!";

  if (process.env.NODE_ENV === "production" && !process.env.FORCE_TEST_ADMIN) {
    console.error(
      "Refusing to create a test admin in production. Set FORCE_TEST_ADMIN=1 to override (not recommended).",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db.update(users).set({ passwordHash, role: "owner" }).where(eq(users.id, existing.id));
    console.log(`Updated existing user to owner: ${email}`);
  } else {
    await db.insert(users).values({
      email,
      passwordHash,
      role: "owner",
      name: "Test Admin",
    });
    console.log(`Created test owner user: ${email}`);
  }

  console.log("\nYou can sign in at /dashboard/sign-in with:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

