import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...coreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/decks/**"],
  },
];

export default eslintConfig;
