/**
 * A tiny, dependency-free model of what semantic-release does: given Conventional Commit
 * messages, decide the semver bump. It exists so the CI pipeline has real code to lint,
 * typecheck, test and build — and it doubles as executable documentation of the rules in
 * docs/conventional-commits.md.
 */

export type Bump = "major" | "minor" | "patch";

export interface ParsedCommit {
  type: string;
  scope: string | undefined;
  breaking: boolean;
  subject: string;
}

// type(scope)!: subject   — scope and "!" are optional.
const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^()\r\n]+)\))?(?<bang>!)?: (?<subject>\S.*)$/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE: \S/m;

const RANK: Record<Bump, number> = { patch: 1, minor: 2, major: 3 };

/** Parses a commit message. Returns `null` when the header isn't a Conventional Commit. */
export function parseCommit(message: string): ParsedCommit | null {
  const [header = "", ...rest] = message.split(/\r?\n/);
  const groups = HEADER.exec(header.trim())?.groups;
  if (!groups?.type || !groups.subject) return null;

  return {
    type: groups.type,
    scope: groups.scope,
    breaking: groups.bang === "!" || BREAKING_FOOTER.test(rest.join("\n")),
    subject: groups.subject,
  };
}

/** The bump a single commit implies, or `null` if it doesn't trigger a release. */
export function bumpForCommit(message: string): Bump | null {
  const commit = parseCommit(message);
  if (!commit) return null;
  if (commit.breaking) return "major";
  if (commit.type === "feat") return "minor";
  if (commit.type === "fix" || commit.type === "perf") return "patch";
  return null;
}

/** The highest bump across all commits, or `null` if none of them trigger a release. */
export function bumpFor(messages: readonly string[]): Bump | null {
  let best: Bump | null = null;
  for (const message of messages) {
    const bump = bumpForCommit(message);
    if (bump && (!best || RANK[bump] > RANK[best])) best = bump;
  }
  return best;
}

/** Applies a bump to a `major.minor.patch` version string. */
export function nextVersion(current: string, bump: Bump): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) throw new Error(`Not a plain semver version: "${current}"`);
  const [major, minor, patch] = match.slice(1).map(Number) as [number, number, number];

  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
