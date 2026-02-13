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
        content="Watch an agent present how George thinks — one concept at a time."
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
                      DEFAULT: '#fafaf9',
                      raised: '#f5f5f4',
                      overlay: '#e7e5e4',
                    },
                    ink: {
                      DEFAULT: '#1c1917',
                      muted: '#78716c',
                      faint: '#a8a29e',
                    },
                    accent: {
                      DEFAULT: '#7c3aed',
                      light: '#c4b5fd',
                      faint: '#ede9fe',
                    },
                  },
                  fontFamily: {
                    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                    serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
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
              background-color: #fafaf9;
              color: #1c1917;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
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
