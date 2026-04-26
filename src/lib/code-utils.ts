import type { SelectedElement } from "@/types/builder";

export function extractElementAndParent(
  html: string,
  elementId: string
): { selectedSnippet: string; parentSnippet?: string } | null {
  if (typeof window === "undefined") {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const selected = doc.querySelector(`[data-ai-id=\"${elementId}\"]`);
  if (!selected) {
    return null;
  }

  const parent = selected.parentElement;

  return {
    selectedSnippet: selected.outerHTML,
    parentSnippet: parent?.outerHTML
  };
}

export function applySnippetById(html: string, selected: SelectedElement, updatedSnippet: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const target = doc.querySelector(`[data-ai-id=\"${selected.id}\"]`);

  if (!target) {
    throw new Error("Selected element no longer exists in current HTML.");
  }

  const replacementDoc = parser.parseFromString(`<body>${updatedSnippet}</body>`, "text/html");
  const replacement = replacementDoc.body.firstElementChild;

  if (!replacement) {
    throw new Error("AI response did not contain a valid HTML element snippet.");
  }

  if (!replacement.hasAttribute("data-ai-id")) {
    replacement.setAttribute("data-ai-id", selected.id);
  }

  if (replacement.getAttribute("data-ai-id") !== selected.id) {
    throw new Error("AI response attempted to change element identity.");
  }

  target.replaceWith(replacement);

  return doc.documentElement.outerHTML;
}

export function normalizeDocumentHtml(docHtml: string): string {
  if (docHtml.startsWith("<!DOCTYPE")) {
    return docHtml;
  }
  return `<!DOCTYPE html>${docHtml}`;
}
