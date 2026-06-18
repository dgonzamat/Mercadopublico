import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f7f2e8",
        panel: "#ede6d4",
        "surface-2": "#dfd5be",
        border: "#c4b89d",
        text: "#1a1a1a",
        muted: "#6b6356",
        accent: "#c41e3a",
        // CC-1 · mismo matiz, más luz — para text-accent sobre bg-text (5.4:1 AA)
        "accent-bright": "#ee6075",
        tierS: "#8b0000",
        // Oscurecido desde #b86b1f (3.65:1, fallaba AA) → 4.84:1 sobre bg,
        // mismo matiz naranja. AA texto normal para el badge Tier A.
        tierA: "#9c5a18",
        tierB: "#1e4f8b",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
        display: [
          "var(--font-display)",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
