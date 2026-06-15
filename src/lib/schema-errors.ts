export function isSchemaSetupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("attribute not found in schema") ||
    lower.includes("unknown attribute") ||
    lower.includes("invalid query")
  );
}

export function getSchemaSetupMessage(): string {
  return (
    "Database schema is incomplete. Run: npm run appwrite:setup " +
    "(requires APPWRITE_API_KEY in .env). See docs/APPWRITE_SETUP.md"
  );
}
