"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PreviewFrame } from "@/components/PreviewFrame";
import { applySnippetById, normalizeDocumentHtml } from "@/lib/code-utils";
import { createDefaultTemplate } from "@/lib/templates";
import type { EditResponse, GenerateResponse, SelectedElement } from "@/types/builder";

type AppPhase = "home" | "loading" | "preview";

type FocusedSection = SelectedElement & {
  parentSnippet?: string;
};

type SelectionPayload = {
  id: string;
  tagName: string;
  snippet: string;
  textPreview: string;
  componentPath?: string;
  parentSnippet?: string;
  viewportX?: number;
  viewportY?: number;
};

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function composePrompt(projectNature: string, lookAndFeel: string): string {
  return [
    `Project nature: ${projectNature.trim()}`,
    `Desired look and feel: ${lookAndFeel.trim()}`
  ].join("\n");
}

function stripCodeFences(value: string): string {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("home");
  const [projectNature, setProjectNature] = useState("A startup website for a B2B analytics platform");
  const [lookAndFeel, setLookAndFeel] = useState("Calm, premium, minimal, with clean typography and generous spacing");
  const [html, setHtml] = useState(() =>
    normalizeDocumentHtml(createDefaultTemplate("Prompt-driven website draft"))
  );
  const [status, setStatus] = useState("Ready to render");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<FocusedSection | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | undefined>(undefined);
  const [sectionInstruction, setSectionInstruction] = useState("");
  const [floatingPanel, setFloatingPanel] = useState({
    x: 40,
    y: 120,
    visible: false
  });

  const selectedId = selected?.id;
  const canGenerate = projectNature.trim().length > 0 && lookAndFeel.trim().length > 0 && !isGenerating;
  const canApplyEdit = Boolean(selected && sectionInstruction.trim() && !isEditing);

  const composedPrompt = useMemo(
    () => composePrompt(projectNature, lookAndFeel),
    [projectNature, lookAndFeel]
  );

  useEffect(() => {
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFloatingPanel((prev) => ({ ...prev, visible: false }));
      }
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  function placeFloatingPanel(pointerX?: number, pointerY?: number) {
    if (typeof window === "undefined") {
      return;
    }

    const panelWidth = 340;
    const panelHeight = 252;
    const baseX = pointerX ?? window.innerWidth - panelWidth - 24;
    const baseY = pointerY ?? 132;
    const maxX = Math.max(12, window.innerWidth - panelWidth - 12);
    const maxY = Math.max(12, window.innerHeight - panelHeight - 12);

    setFloatingPanel({
      visible: true,
      x: clamp(baseX + 14, 12, maxX),
      y: clamp(baseY + 14, 12, maxY)
    });
  }

  function resetSelection() {
    setSelected(null);
    setSelectedParent(undefined);
    setSectionInstruction("");
    setFloatingPanel((prev) => ({ ...prev, visible: false }));
  }

  async function handleRenderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) {
      return;
    }

    setPhase("loading");
    setStatus("Rendering your interface...");
    setIsGenerating(true);
    resetSelection();

    const started = performance.now();

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          prompt: composedPrompt
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || "Unable to render interface");
      }

      const data = (await response.json()) as GenerateResponse;
      const nextHtml = normalizeDocumentHtml(stripCodeFences(data.html));
      const elapsed = performance.now() - started;
      const minimumLoadingMs = 1200;

      if (elapsed < minimumLoadingMs) {
        await new Promise((resolve) => window.setTimeout(resolve, minimumLoadingMs - elapsed));
      }

      setHtml(nextHtml);
      setStatus(data.summary || "Rendered successfully");
      setPhase("preview");
    } catch (error) {
      setPhase("home");
      setStatus(error instanceof Error ? error.message : "Unable to render interface");
    } finally {
      setIsGenerating(false);
    }
  }

  async function applySectionEdit() {
    if (!selected) {
      setStatus("Select a section first.");
      return;
    }

    const instruction = sectionInstruction.trim();
    if (!instruction) {
      setStatus("Write an instruction for the selected section.");
      return;
    }

    setIsEditing(true);
    setStatus(`Updating ${selected.id}...`);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "edit",
          instruction,
          selected,
          parentSnippet: selectedParent,
          fullHtml: html
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || "Edit failed");
      }

      const data = (await response.json()) as EditResponse;
      const cleanedSnippet = stripCodeFences(data.updatedSnippet);
      const nextHtml = normalizeDocumentHtml(applySnippetById(html, selected, cleanedSnippet));
      const refreshedSelection: FocusedSection = {
        ...selected,
        snippet: cleanedSnippet
      };

      setHtml(nextHtml);
      setSelected(refreshedSelection);
      setStatus(data.explanation || "Section updated");
      setSectionInstruction("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Edit failed");
    } finally {
      setIsEditing(false);
    }
  }

  function handleSectionSelect(payload: SelectionPayload) {
    const section: FocusedSection = {
      id: payload.id,
      tagName: payload.tagName,
      snippet: payload.snippet,
      textPreview: payload.textPreview,
      componentPath: payload.componentPath,
      parentSnippet: payload.parentSnippet
    };

    setSelected(section);
    setSelectedParent(payload.parentSnippet);
    setStatus(`Focused ${section.id}`);
    placeFloatingPanel(payload.viewportX, payload.viewportY);
  }

  function returnToHome() {
    setPhase("home");
    setStatus("Ready to render");
    resetSelection();
  }

  return (
    <main className={phase === "preview" ? "studio is-preview" : "studio"}>
      <div className="animated-gradient" aria-hidden="true" />

      {phase === "home" ? (
        <section className="screen home-view transition-in">
          <form className="home-card" onSubmit={handleRenderSubmit}>
            <header className="home-header">
              <p className="eyebrow">Interface Composer</p>
              <h1>Describe the project, then generate an editable UI draft.</h1>
              <p className="supporting-text">
                Start with the project direction and visual intent. This is the primary entry point for every render.
              </p>
            </header>

            <div className="prompt-grid">
              <label className="field-block" htmlFor="project-nature">
                <span>Project Nature</span>
                <textarea
                  id="project-nature"
                  rows={5}
                  value={projectNature}
                  onChange={(event) => setProjectNature(event.target.value)}
                  placeholder="Example: Portfolio website for an architecture studio with case studies and contact flow"
                />
              </label>

              <label className="field-block" htmlFor="look-feel">
                <span>Desired Look and Feel</span>
                <textarea
                  id="look-feel"
                  rows={5}
                  value={lookAndFeel}
                  onChange={(event) => setLookAndFeel(event.target.value)}
                  placeholder="Example: Minimal editorial style, neutral palette, subtle interactions, premium spacing"
                />
              </label>
            </div>

            <div className="home-footer">
              <p className="status-line">{status}</p>
              <button className="primary-action" type="submit" disabled={!canGenerate}>
                {isGenerating ? "Rendering..." : "Render Interface"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {phase === "loading" ? (
        <section className="screen loading-view transition-in" role="status" aria-live="polite">
          <div className="loading-glass">
            <p className="loading-kicker">Rendering</p>
            <h2>Building your first interface pass</h2>
            <div className="loading-track" aria-hidden="true">
              <span />
            </div>
            <p className="loading-note">{status}</p>
          </div>
        </section>
      ) : null}

      {phase === "preview" ? (
        <section className="screen preview-view transition-in">
          <div className="preview-toolbar">
            <button type="button" className="ghost-action" onClick={returnToHome}>
              New Prompt
            </button>
          </div>

          <div className="preview-stage">
            <div className="preview-canvas">
              <PreviewFrame html={html} selectedId={selectedId} onElementSelect={handleSectionSelect} />
            </div>

            <aside
              className={floatingPanel.visible ? "floating-editor is-visible" : "floating-editor"}
              style={{ left: floatingPanel.x, top: floatingPanel.y }}
            >
              <div className="floating-head">
                <p>{selected ? `${selected.tagName.toUpperCase()} / ${selected.id}` : "Section"}</p>
                <button
                  type="button"
                  className="ghost-action small"
                  onClick={() => setFloatingPanel((prev) => ({ ...prev, visible: false }))}
                >
                  Close
                </button>
              </div>

              <label className="floating-label" htmlFor="section-instruction">
                Edit instruction
              </label>
              <textarea
                id="section-instruction"
                rows={4}
                value={sectionInstruction}
                onChange={(event) => setSectionInstruction(event.target.value)}
                placeholder={
                  selected
                    ? "Describe exactly how this selected section should change..."
                    : "Click a section in the preview first."
                }
                disabled={!selected}
              />

              <button type="button" className="primary-action small" onClick={applySectionEdit} disabled={!canApplyEdit}>
                {isEditing ? "Applying..." : "Apply Update"}
              </button>
            </aside>
          </div>
        </section>
      ) : null}
    </main>
  );
}
