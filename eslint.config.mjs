// Next 16 isporucuje gotove flat-config module, pa vise ne treba
// FlatCompat/@eslint/eslintrc (stari kompat-sloj pravi circular JSON
// gresku sa novijim eslint-plugin-react verzijama).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
