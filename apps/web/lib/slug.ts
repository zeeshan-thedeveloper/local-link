export function generateSlug(name: string): string {
  let slug = "";
  let pendingHyphen = false;

  for (const char of name.toLowerCase().trim()) {
    const code = char.charCodeAt(0);
    const isLowerAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (isLowerAlpha || isDigit) {
      if (pendingHyphen && slug) slug += "-";
      slug += char;
      pendingHyphen = false;
      continue;
    }

    pendingHyphen = true;
  }

  return slug;
}
