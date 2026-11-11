import { describe, expect, it } from "vitest";
import { bumpFor, bumpForCommit, nextVersion, parseCommit } from "./index.js";

describe("parseCommit", () => {
  it("parses type, scope and subject", () => {
    expect(parseCommit("feat(api): add search")).toEqual({
      type: "feat",
      scope: "api",
      breaking: false,
      subject: "add search",
    });
  });

  it("allows a missing scope", () => {
    expect(parseCommit("fix: handle empty input")?.scope).toBeUndefined();
  });

  it("detects `!` and BREAKING CHANGE footers", () => {
    expect(parseCommit("refactor!: drop Node 18")?.breaking).toBe(true);
    expect(parseCommit("feat: new config\n\nBREAKING CHANGE: `foo` was renamed")?.breaking).toBe(true);
    expect(parseCommit("feat: new config\n\nBREAKING-CHANGE: `foo` was renamed")?.breaking).toBe(true);
  });

  it("rejects non-conventional messages", () => {
    expect(parseCommit("Update README")).toBeNull();
    expect(parseCommit("feat:missing space")).toBeNull();
    expect(parseCommit("")).toBeNull();
  });
});

describe("bumpForCommit", () => {
  it.each([
    ["feat: x", "minor"],
    ["fix: x", "patch"],
    ["perf: x", "patch"],
    ["feat!: x", "major"],
    ["chore: x", null],
    ["docs: x", null],
    ["not conventional", null],
  ] as const)("%s → %s", (message, expected) => {
    expect(bumpForCommit(message)).toBe(expected);
  });
});

describe("bumpFor", () => {
  it("returns the highest bump", () => {
    expect(bumpFor(["fix: a", "feat: b", "chore: c"])).toBe("minor");
    expect(bumpFor(["feat: a", "fix!: b"])).toBe("major");
  });

  it("returns null when nothing releases", () => {
    expect(bumpFor(["docs: a", "chore: b"])).toBeNull();
    expect(bumpFor([])).toBeNull();
  });
});

describe("nextVersion", () => {
  it("bumps each part and resets the lower ones", () => {
    expect(nextVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
  });

  it("throws on non-semver input", () => {
    expect(() => nextVersion("v1.2", "patch")).toThrow(/Not a plain semver/);
  });
});
