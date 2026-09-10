import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(
  resolve(dir, "../.github/workflows/notify-consumers.yml"),
  "utf-8",
);

/**
 * Repositories that were retired from the suite. Dispatching to an archived repo
 * returns 403 and fails the notify job with no recovery path, so the matrix must
 * never list one.
 */
const ARCHIVED_REPOS = ["jongio/azd-exec", "jongio/azd-copilot"];

const ACTIVE_CONSUMERS = [
  "jongio/azd-app",
  "jongio/azd-extensions",
  "jongio/azd-rest",
];

function matrixRepos(src: string): string[] {
  // Scope to the matrix `repo:` list so an unrelated repo reference elsewhere in
  // the workflow cannot satisfy or break these assertions, and drop comments so a
  // commented-out entry is never mistaken for a live one.
  const block = /^\s*repo:\s*$((?:\r?\n\s*(?:#.*|-\s*\S+))*)/m.exec(src)?.[1] ?? "";
  return [...block.replace(/^\s*#.*$/gm, "").matchAll(/-\s*(\S+)/g)].map((m) => m[1]).sort();
}

describe("notify-consumers workflow (D5)", () => {
  it("T19: dispatches to no archived repository", () => {
    const repos = matrixRepos(workflow);
    expect(repos).not.toHaveLength(0);
    for (const archived of ARCHIVED_REPOS) {
      expect(repos).not.toContain(archived);
    }
  });

  it("T20: covers exactly the active consumer sites", () => {
    expect(matrixRepos(workflow)).toEqual([...ACTIVE_CONSUMERS].sort());
  });

  it("T27: builds the dispatch payload with toJSON, not string splicing", () => {
    // Git permits `"` in ref names. Interpolating the ref into JSON with
    // format() lets a crafted tag inject payload keys or break parsing for
    // every consumer at once.
    const payload = /client-payload:.*/.exec(workflow)?.[0] ?? "";
    expect(payload).toContain("toJSON(github.event.workflow_run.head_branch)");
    expect(payload).not.toContain("format(");
  });

  it("T28: only dispatches for pushed version tags", () => {
    expect(workflow).toContain("github.event.workflow_run.event == 'push'");
    expect(workflow).toContain("startsWith(github.event.workflow_run.head_branch, 'v')");
  });
});
