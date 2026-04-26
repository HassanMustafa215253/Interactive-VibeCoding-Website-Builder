const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

function shouldTag(tagName: string): boolean {
  if (!tagName || tagName.startsWith("!")) {
    return false;
  }
  return !["html", "head", "body", "style", "script", "meta", "title"].includes(
    tagName.toLowerCase()
  );
}

export function ensureElementIds(html: string): string {
  let counter = 1;
  return html.replace(/<([a-zA-Z][^\s/>]*)([^>]*?)>/g, (match, rawTag, rawAttrs) => {
    const tag = String(rawTag || "").toLowerCase();
    if (!shouldTag(tag)) {
      return match;
    }

    if (/\sdata-ai-id\s*=/.test(rawAttrs)) {
      return match;
    }

    const id = `${tag}_${counter++}`;
    const isSelfClosing = /\/\s*$/.test(rawAttrs) || VOID_TAGS.has(tag);
    const attrs = rawAttrs || "";

    if (isSelfClosing) {
      return `<${rawTag}${attrs} data-ai-id=\"${id}\">`;
    }

    return `<${rawTag}${attrs} data-ai-id=\"${id}\">`;
  });
}

export function createVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
