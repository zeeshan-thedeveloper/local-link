export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^chore: version packages$/i.test(message.trim())],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "revert"]
    ],
    "subject-max-length": [2, "always", 100]
  }
};
