export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>George Stander</title>
      <meta
        name="description"
        content="Meet George's AI agent — a conversational portfolio that shows you who he is."
      />
      <script src="https://cdn.tailwindcss.com"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    surface: {
                      DEFAULT: '#0a0a0a',
                      raised: '#141414',
                      overlay: '#1e1e1e',
                    },
                    accent: {
                      DEFAULT: '#c4b5fd',
                      dim: '#7c3aed',
                    },
                    muted: '#a1a1aa',
                  },
                  fontFamily: {
                    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                  },
                },
              },
            }
          `,
        }}
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background-color: #0a0a0a;
              color: #e4e4e7;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

            /* Smooth animations */
            * { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          `,
        }}
      />
      <script type="module" src="/src/client.tsx"></script>
    </head>
    <body>
      <div id="root">{children}</div>
    </body>
  </html>
);
