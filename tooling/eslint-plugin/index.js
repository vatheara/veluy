// @ts-check
import noHardcodedVersion from "./rules/no-hardcoded-version-in-test.js";
import noThrowingPromises from "./rules/no-throwing-promises.js";

const recommended = {
  plugins: ["@veluy"],
  rules: {
    ["@veluy/no-throwing-promises"]: "error",
  },
};

export const rules = {
  "no-throwing-promises": noThrowingPromises,
  "no-hard-coded-version-in-test": noHardcodedVersion,
};

export const configs = { recommended };
