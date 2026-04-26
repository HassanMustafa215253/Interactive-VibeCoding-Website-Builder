export function createDefaultTemplate(prompt: string): string {
  const safePrompt = prompt.trim() || "Modern product landing page";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safePrompt}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #060914;
        --bg-2: #0a1020;
        --panel: rgba(11, 17, 33, 0.88);
        --panel-strong: rgba(15, 23, 44, 0.96);
        --card: rgba(14, 22, 41, 0.92);
        --line: rgba(122, 140, 179, 0.18);
        --ink: #f4f7ff;
        --muted: #99a7c5;
        --brand: #63e2e7;
        --brand-2: #8893ff;
        --danger: #ff7d6d;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: Inter, "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(99, 226, 231, 0.12), transparent 28%),
          radial-gradient(circle at top right, rgba(136, 147, 255, 0.14), transparent 24%),
          linear-gradient(180deg, var(--bg) 0%, #03050b 100%);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 38px 38px;
        mask-image: radial-gradient(circle at center, black 30%, transparent 88%);
      }
      .container {
        width: min(1160px, calc(100vw - 40px));
        margin: 0 auto;
      }
      .nav {
        padding: 22px 0;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(7, 11, 22, 0.72);
        backdrop-filter: blur(14px);
        padding: 14px 18px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .brand-mark {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--brand-2), var(--brand));
        box-shadow: 0 14px 24px rgba(99, 226, 231, 0.18);
        position: relative;
      }
      .brand-mark::before,
      .brand-mark::after {
        content: "";
        position: absolute;
        background: rgba(3, 5, 11, 0.9);
      }
      .brand-mark::before {
        left: 10px;
        top: 8px;
        bottom: 8px;
        width: 6px;
        border-radius: 999px;
      }
      .brand-mark::after {
        right: 8px;
        top: 10px;
        bottom: 10px;
        width: 12px;
        clip-path: polygon(0 0, 100% 0, 48% 100%, 0 100%);
      }
      .nav-links {
        display: flex;
        align-items: center;
        gap: 18px;
        color: var(--muted);
        font-size: 0.93rem;
      }
      .nav-links a {
        color: inherit;
        text-decoration: none;
      }
      .nav-links a:hover {
        color: var(--ink);
      }
      .nav-cta {
        border: 1px solid rgba(99, 226, 231, 0.24);
        background: rgba(99, 226, 231, 0.1);
        color: var(--brand);
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 0.84rem;
        font-weight: 700;
      }
      .hero {
        padding: 34px 0 28px;
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        gap: 22px;
        align-items: stretch;
      }
      .hero-copy,
      .hero-stack {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(13, 20, 38, 0.92), rgba(8, 13, 24, 0.96));
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
      }
      .hero-copy {
        padding: 28px;
      }
      .hero-stack {
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        border: 1px solid rgba(99, 226, 231, 0.2);
        background: rgba(99, 226, 231, 0.08);
        color: var(--brand);
        padding: 8px 12px;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 12px;
        font-size: clamp(2.4rem, 6vw, 5.2rem);
        line-height: 0.95;
        letter-spacing: -0.06em;
        max-width: 10ch;
      }
      .hero-copy p {
        max-width: 58ch;
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
        font-size: 1rem;
      }
      .cta {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .button {
        border-radius: 16px;
        padding: 12px 18px;
        border: 1px solid transparent;
        cursor: pointer;
        font-size: 0.92rem;
        font-weight: 700;
      }
      .button.primary {
        color: #021018;
        background: linear-gradient(135deg, var(--brand-2), var(--brand));
        box-shadow: 0 16px 34px rgba(99, 226, 231, 0.18);
      }
      .button.secondary {
        background: rgba(10, 16, 31, 0.9);
        border-color: var(--line);
        color: var(--ink);
      }
      .signal-card,
      .stack-card,
      .card {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--card);
      }
      .signal-card {
        padding: 18px;
      }
      .signal-card h3,
      .stack-card h3,
      .card h3 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: -0.02em;
      }
      .signal-card p,
      .stack-card p,
      .card p {
        margin: 10px 0 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .signal-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }
      .signal-metric {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: rgba(8, 12, 24, 0.84);
      }
      .signal-metric strong {
        display: block;
        font-size: 1.4rem;
        letter-spacing: -0.04em;
      }
      .signal-metric span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .stack-card {
        padding: 18px;
      }
      .stack-list {
        margin: 14px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .stack-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 12px 14px;
        color: var(--muted);
        background: rgba(8, 12, 24, 0.78);
      }
      .stack-list strong {
        color: var(--ink);
      }
      .feature-grid {
        padding: 8px 0 52px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .card {
        padding: 20px;
      }
      .card-number {
        display: inline-flex;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        background: rgba(136, 147, 255, 0.14);
        color: #b7c0ff;
        font-weight: 800;
      }
      @media (max-width: 980px) {
        .nav-inner,
        .hero,
        .feature-grid,
        .signal-grid {
          grid-template-columns: 1fr;
        }
        .nav-inner {
          display: grid;
        }
        .nav-links {
          flex-wrap: wrap;
        }
      }
      @media (max-width: 640px) {
        .container {
          width: min(100vw - 20px, 1160px);
        }
        .hero-copy,
        .hero-stack,
        .card,
        .signal-card,
        .stack-card {
          border-radius: 22px;
        }
        .hero-copy {
          padding: 22px;
        }
        h1 {
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <nav class="nav">
        <div class="nav-inner">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true"></span>
            <span>Northstar Studio</span>
          </div>
          <div class="nav-links">
            <a href="#">Work</a>
            <a href="#">Services</a>
            <a href="#">System</a>
            <a href="#">Contact</a>
          </div>
          <div class="nav-cta">Now booking Q3 launches</div>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-copy">
          <span class="kicker">AI-generated first draft</span>
          <h1>${safePrompt}</h1>
          <p>
            A sharper default homepage with stronger hierarchy, darker product-grade styling, and clean sections
            ready for scoped edits directly inside the builder.
          </p>
          <div class="cta">
            <button class="button primary">Start Project</button>
            <button class="button secondary">See Capabilities</button>
          </div>
          <div class="signal-grid">
            <div class="signal-metric">
              <strong>4x</strong>
              <span>Faster concept alignment</span>
            </div>
            <div class="signal-metric">
              <strong>32%</strong>
              <span>Average conversion lift</span>
            </div>
          </div>
        </div>

        <div class="hero-stack">
          <div class="signal-card">
            <h3>Delivery model</h3>
            <p>Strategy, UX, and production UI packaged into fast-moving sprints built for ambitious launches.</p>
          </div>
          <div class="stack-card">
            <h3>Execution stack</h3>
            <ul class="stack-list">
              <li><strong>Positioning</strong><span>Sharper message architecture</span></li>
              <li><strong>Interface</strong><span>Edge-led visual systems</span></li>
              <li><strong>Iteration</strong><span>Versioned improvements on demand</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section class="feature-grid">
        <article class="card">
          <span class="card-number">01</span>
          <h3>Product-level polish</h3>
          <p>Layout, contrast, and spacing choices that feel intentional from the first render.</p>
        </article>
        <article class="card">
          <span class="card-number">02</span>
          <h3>Scoped editing flow</h3>
          <p>Select an exact region, edit only that block, and keep the surrounding structure stable.</p>
        </article>
        <article class="card">
          <span class="card-number">03</span>
          <h3>Fast decision loops</h3>
          <p>Checkpoint every direction, compare versions quickly, and move without losing momentum.</p>
        </article>
      </section>
    </div>
  </body>
</html>`;
}
