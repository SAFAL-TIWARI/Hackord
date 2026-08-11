export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hackord — System Recovery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background-color: #060813; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2.5rem; background: rgba(10, 15, 30, 0.4); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 1.5rem; backdrop-filter: blur(24px); box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.6); }
      h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem; }
      p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button { font-weight: 600; font-size: 0.875rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all 0.2s; }
      .primary { background: linear-gradient(135deg, #8b5cf6 0%, #38bdf8 100%); color: #fff; border: none; box-shadow: 0 10px 30px -5px rgba(139, 92, 246, 0.5); }
      .secondary { background: rgba(255, 255, 255, 0.05); color: #f8fafc; border-color: rgba(255, 255, 255, 0.1); }
      .secondary:hover { background: rgba(255, 255, 255, 0.1); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Temporary Service Interruption</h1>
      <p>The system encountered a minor glitch while loading. Please try refreshing or return to the main platform home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Reload Page</button>
        <a class="secondary" href="/">Go Home</a>
      </div>
    </div>
  </body>
</html>`;
}
