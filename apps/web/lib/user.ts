export function displayNameFromEmail(email?: string | null) {
  if (!email) return "there";

  const [localPart = ""] = email.split("@");
  const words = localPart
    .replace(/\d+/g, " ")
    .split(/[._-]+|\s+/)
    .filter(Boolean);

  if (words.length === 0) return localPart || "there";

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
