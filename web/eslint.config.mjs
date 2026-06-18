import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Flat config (ESLint 9 + Next 16). `next lint` ya no existe en Next 16;
// se ejecuta con `npm run lint` (eslint .). Reintroduce el linting que la
// migración a Next 16 había dejado sin configurar — los comentarios
// eslint-disable del código vuelven a tener efecto.
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
