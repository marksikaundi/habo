/**
 * Creates Appwrite collection attributes and indexes required by Habora.
 *
 * Prerequisites:
 * 1. Create an API key in Appwrite Console → API Keys (scopes: databases.write)
 * 2. Add APPWRITE_API_KEY to your .env file
 * 3. Collections must already exist (tasks, goals, notes, notifications, user_stats)
 *
 * Run: npm run appwrite:setup
 */
require("dotenv").config();

const { Client, Databases, Permission, Role } = require("node-appwrite");

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const COLLECTIONS = {
  tasks: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_TASKS ?? "tasks",
  goals: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_GOALS ?? "goals",
  notes: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTES ?? "notes",
  notifications:
    process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTIFICATIONS ?? "notifications",
  user_stats:
    process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_USER_STATS ?? "user_stats",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAlreadyExists(error) {
  return (
    error?.code === 409 ||
    error?.type === "attribute_already_exists" ||
    error?.type === "index_already_exists" ||
    String(error?.message ?? "").toLowerCase().includes("already")
  );
}

async function ensureString(db, collectionId, key, required = false, size = 255) {
  try {
    await db.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      size,
      required,
    });
    console.log(`    + string  ${key}`);
    await sleep(1200);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`    = string  ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureInteger(db, collectionId, key, required = false, min = 0, max = 999999) {
  try {
    await db.createIntegerAttribute({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      required,
      min,
      max,
    });
    console.log(`    + integer ${key}`);
    await sleep(1200);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`    = integer ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureBoolean(db, collectionId, key, required = false, defaultValue = false) {
  try {
    await db.createBooleanAttribute({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      required,
      default: defaultValue,
    });
    console.log(`    + boolean ${key}`);
    await sleep(1200);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`    = boolean ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureEnum(db, collectionId, key, elements, required = false) {
  try {
    await db.createEnumAttribute({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      elements,
      required,
    });
    console.log(`    + enum    ${key}`);
    await sleep(1200);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`    = enum    ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureIndex(db, collectionId, key, attributes) {
  try {
    await db.createIndex({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      type: "key",
      attributes,
    });
    console.log(`    + index   ${key}`);
    await sleep(800);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`    = index   ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureCollectionPermissions(db, collectionId) {
  const collection = await db.getCollection({
    databaseId: DATABASE_ID,
    collectionId,
  });

  await db.updateCollection({
    databaseId: DATABASE_ID,
    collectionId,
    name: collection.name,
    permissions: [
      Permission.create(Role.users()),
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    documentSecurity: true,
    enabled: collection.enabled,
  });
  console.log(`    ✓ permissions updated (users + document security)`);
}

async function setupCollection(db, collectionId, setupFn) {
  console.log(`\n→ ${collectionId}`);
  await setupFn();
  await ensureIndex(db, collectionId, "by_userId", ["userId"]);
  await ensureCollectionPermissions(db, collectionId);
}

async function main() {
  if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID) {
    console.error("Missing EXPO_PUBLIC_APPWRITE_ENDPOINT, PROJECT_ID, or DATABASE_ID in .env");
    process.exit(1);
  }
  if (!API_KEY) {
    console.error(
      "\nMissing APPWRITE_API_KEY in .env\n\n" +
        "1. Appwrite Console → API Keys → Create API Key\n" +
        "2. Enable scope: databases.write\n" +
        "3. Add to .env: APPWRITE_API_KEY=your_key_here\n" +
        "4. Run again: npm run appwrite:setup\n",
    );
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const db = new Databases(client);

  console.log("Setting up Habora Appwrite schema...");
  console.log(`Database: ${DATABASE_ID}`);

  await setupCollection(db, COLLECTIONS.tasks, async () => {
    await ensureString(db, COLLECTIONS.tasks, "userId", true);
    await ensureString(db, COLLECTIONS.tasks, "title", true);
    await ensureString(db, COLLECTIONS.tasks, "description", false);
    await ensureString(db, COLLECTIONS.tasks, "dueDate", true);
    await ensureString(db, COLLECTIONS.tasks, "dueTime", false);
    await ensureEnum(db, COLLECTIONS.tasks, "priority", ["high", "medium", "low"], true);
    await ensureString(db, COLLECTIONS.tasks, "category", true);
    await ensureBoolean(db, COLLECTIONS.tasks, "completed", true, false);
    await ensureString(db, COLLECTIONS.tasks, "goalId", false);
    await ensureString(db, COLLECTIONS.tasks, "subtasks", false, 8192);
  });

  await setupCollection(db, COLLECTIONS.goals, async () => {
    await ensureString(db, COLLECTIONS.goals, "userId", true);
    await ensureString(db, COLLECTIONS.goals, "title", true);
    await ensureInteger(db, COLLECTIONS.goals, "progress", true, 0, 100);
    await ensureString(db, COLLECTIONS.goals, "dueDate", true);
  });

  await setupCollection(db, COLLECTIONS.notes, async () => {
    await ensureString(db, COLLECTIONS.notes, "userId", true);
    await ensureString(db, COLLECTIONS.notes, "title", true);
    await ensureString(db, COLLECTIONS.notes, "content", true, 16384);
    await ensureString(db, COLLECTIONS.notes, "tag", true);
    await ensureString(db, COLLECTIONS.notes, "createdAt", true);
    await ensureString(db, COLLECTIONS.notes, "taskId", false);
  });

  await setupCollection(db, COLLECTIONS.notifications, async () => {
    await ensureString(db, COLLECTIONS.notifications, "userId", true);
    await ensureEnum(db, COLLECTIONS.notifications, "type", ["task", "focus", "summary", "goal"], true);
    await ensureString(db, COLLECTIONS.notifications, "title", true);
    await ensureString(db, COLLECTIONS.notifications, "message", true, 2048);
    await ensureString(db, COLLECTIONS.notifications, "time", true);
    await ensureEnum(db, COLLECTIONS.notifications, "group", ["today", "yesterday"], true);
    await ensureBoolean(db, COLLECTIONS.notifications, "read", true, false);
  });

  await setupCollection(db, COLLECTIONS.user_stats, async () => {
    await ensureString(db, COLLECTIONS.user_stats, "userId", true);
    await ensureInteger(db, COLLECTIONS.user_stats, "focusMinutesToday", true);
    await ensureInteger(db, COLLECTIONS.user_stats, "focusStreak", true);
    await ensureInteger(db, COLLECTIONS.user_stats, "xp", true);
    await ensureInteger(db, COLLECTIONS.user_stats, "level", true);
  });

  console.log("\n✅ Schema setup complete! Restart the app and log in again.\n");
}

main().catch((error) => {
  console.error("\n❌ Setup failed:", error.message ?? error);
  process.exit(1);
});
