"use client";

import { useEffect, useMemo, useRef } from "react";

type PreviewFrameProps = {
  html: string;
  selectedId?: string;
  onElementSelect: (payload: {
    id: string;
    tagName: string;
    snippet: string;
    textPreview: string;
    componentPath?: string;
    parentSnippet?: string;
    viewportX?: number;
    viewportY?: number;
  }) => void;
};

function injectBridge(html: string): string {
  const bridgeCss = `
    [data-ai-id] { cursor: pointer !important; }
    [data-ai-selected=\"true\"] {
      outline: 2px solid #0fa5a6 !important;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px rgba(15, 165, 166, 0.24);
    }
    [data-ai-flash=\"true\"] {
      animation: aiFlash 900ms ease;
    }
    @keyframes aiFlash {
      0% { box-shadow: 0 0 0 0 rgba(255, 107, 44, 0.55); }
      100% { box-shadow: 0 0 0 14px rgba(255, 107, 44, 0); }
    }
  `;

  const bridgeScript = `
    (function() {
      const CHANNEL = "ai-builder-select";
      const PING = "ai-builder-ping";
      let currentSelectedId = "";

      function setSelectedById(id) {
        document.querySelectorAll("[data-ai-selected='true']").forEach((n) => {
          n.removeAttribute("data-ai-selected");
        });
        if (!id) return;
        const node = document.querySelector("[data-ai-id='" + id + "']");
        if (node) {
          node.setAttribute("data-ai-selected", "true");
          node.setAttribute("data-ai-flash", "true");
          setTimeout(() => node.removeAttribute("data-ai-flash"), 950);
        }
      }

      function toPayload(el, clickX, clickY) {
        const parent = el.parentElement;
        const path = [];
        let node = el;
        while (node && node instanceof Element && path.length < 5) {
          const id = node.getAttribute("id");
          const cls = (node.getAttribute("class") || "").split(" ").filter(Boolean)[0];
          const label = [node.tagName.toLowerCase(), id ? "#" + id : "", cls ? "." + cls : ""].join("");
          path.unshift(label);
          node = node.parentElement;
        }
        return {
          type: CHANNEL,
          payload: {
            id: el.getAttribute("data-ai-id") || "",
            tagName: el.tagName.toLowerCase(),
            snippet: el.outerHTML,
            textPreview: (el.textContent || "").trim().slice(0, 120),
            componentPath: path.join(" > "),
            parentSnippet: parent ? parent.outerHTML : undefined,
            clickX: typeof clickX === "number" ? clickX : undefined,
            clickY: typeof clickY === "number" ? clickY : undefined
          }
        };
      }

      document.addEventListener("click", function(e) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const selected = target.closest("[data-ai-id]");
        if (!selected) return;
        e.preventDefault();
        e.stopPropagation();
        currentSelectedId = selected.getAttribute("data-ai-id") || "";
        setSelectedById(currentSelectedId);
        window.parent.postMessage(toPayload(selected, e.clientX, e.clientY), "*");
      }, true);

      window.addEventListener("message", function(event) {
        if (!event.data || typeof event.data !== "object") return;
        if (event.data.type === PING) {
          setSelectedById(event.data.selectedId || "");
        }
      });

      setSelectedById(currentSelectedId);
    })();
  `;

  if (html.includes("</head>")) {
    return html.replace(
      "</head>",
      `<style id=\"ai-builder-bridge-style\">${bridgeCss}</style></head>`
    ).replace(
      "</body>",
      `<script id=\"ai-builder-bridge-script\">${bridgeScript}</script></body>`
    );
  }

  return `<!DOCTYPE html><html><head><style>${bridgeCss}</style></head><body>${html}<script>${bridgeScript}</script></body></html>`;
}

export function PreviewFrame({ html, selectedId, onElementSelect }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(() => injectBridge(html), [html]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") {
        return;
      }
      if (event.data.type !== "ai-builder-select") {
        return;
      }

      const payload = event.data.payload;
      const frameBounds = iframeRef.current?.getBoundingClientRect();
      const clickX = typeof payload?.clickX === "number" ? payload.clickX : undefined;
      const clickY = typeof payload?.clickY === "number" ? payload.clickY : undefined;

      onElementSelect({
        ...payload,
        viewportX:
          frameBounds && clickX !== undefined
            ? frameBounds.left + clickX
            : undefined,
        viewportY:
          frameBounds && clickY !== undefined
            ? frameBounds.top + clickY
            : undefined
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onElementSelect]);

  useEffect(() => {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    iframeRef.current.contentWindow.postMessage(
      {
        type: "ai-builder-ping",
        selectedId: selectedId || ""
      },
      "*"
    );
  }, [selectedId]);

  return (
    <iframe
      ref={iframeRef}
      title="AI Website Preview"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="preview-frame"
    />
  );
}
