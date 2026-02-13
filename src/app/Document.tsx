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
                      DEFAULT: '#f8f8f7',
                      raised: '#efeeed',
                      overlay: '#e5e4e3',
                    },
                    ink: {
                      DEFAULT: '#111111',
                      muted: '#66625f',
                      faint: '#8d8a87',
                    },
                    accent: {
                      DEFAULT: '#2f2f2f',
                      light: '#595959',
                      faint: '#ececec',
                    },
                  },
                  fontFamily: {
                    sans: ['system-ui', '-apple-system', 'sans-serif'],
                    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
                    serif: ['Georgia', 'Times New Roman', 'serif'],
                  },
                },
              },
            }
          `,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background-color: #f8f8f7;
              color: #111111;
              font-family: system-ui, -apple-system, sans-serif;
            }

            @keyframes thinking-dot {
              0% {
                transform: translateY(0);
                opacity: 0.3;
              }
              30% {
                transform: translateY(-2px);
                opacity: 0.9;
              }
              60% {
                transform: translateY(0);
                opacity: 0.3;
              }
              100% {
                transform: translateY(0);
                opacity: 0.3;
              }
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #c5c5c4; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #9a9998; }
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
