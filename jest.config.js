import { createDefaultPreset } from "ts-jest";
/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  transform: {
    ...createDefaultPreset().transform,
  },
  testPathIgnorePatterns: ["./src/frames/outgoing/unnumbered/test"], // jest thinks that the test frame file is a jest test file,
  collectCoverage: true,
  coverageReporters: ["text"]
};