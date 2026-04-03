import next from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  { ignores: ["env.d.ts"] },
  ...next,
];

export default config;
