import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const dir = dirname(fileURLToPath(import.meta.url));

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

interface Job {
  needs?: string;
  permissions?: Record<string, string>;
  steps: Step[];
}

interface Workflow {
  permissions?: Record<string, string>;
  jobs: Record<string, Job>;
}

function workflow(name: string): Workflow {
  return parse(readFileSync(resolve(dir, `../.github/workflows/${name}.yml`), "utf-8")) as Workflow;
}

/**
 * The publish job is the only place a credential exists that can ship code to
 * four downstream sites. Keeping third-party code execution out of that job is
 * the control that bounds the blast radius, and it is easy to undo by adding
 * one innocuous-looking step. These assertions make that regression loud.
 */
describe("publish workflow supply-chain isolation", () => {
  const wf = workflow("publish");

  it("T37: grants no elevated permission at the workflow level", () => {
    expect(wf.permissions).toEqual({ contents: "read" });
  });

  it("T38: confines packages/id-token write to the publish job", () => {
    expect(wf.jobs.publish.permissions).toMatchObject({
      "packages": "write",
      "id-token": "write",
    });
    expect(wf.jobs.verify.permissions).toBeUndefined();
  });

  it("T39: runs no build, test, or check tooling in the privileged job", () => {
    const commands = wf.jobs.publish.steps.map((step) => step.run ?? "").join("\n");

    for (const forbidden of ["pnpm test", "pnpm build", "pnpm check", "pnpm lint", "pnpm typecheck"]) {
      expect(commands).not.toContain(forbidden);
    }
  });

  it("T40: installs without lifecycle scripts in the privileged job", () => {
    const install = wf.jobs.publish.steps.find((step) => step.run?.includes("pnpm install"));
    expect(install?.run).toContain("--ignore-scripts");
  });

  it("T41: gates publishing behind the verify job", () => {
    expect(wf.jobs.publish.needs).toBe("verify");
  });

  it("T42: leaves no checkout credential on disk in any job", () => {
    const checkouts = Object.values(wf.jobs).flatMap((job) =>
      job.steps.filter((step) => step.uses?.startsWith("actions/checkout")),
    );

    expect(checkouts).not.toHaveLength(0);
    for (const step of checkouts) {
      expect(step.with?.["persist-credentials"]).toBe(false);
    }
  });

  it("T44: declares public access wherever provenance is requested", () => {
    // pnpm 11 refuses to generate provenance unless access is explicitly
    // public, so a --provenance publish fails at the very last step of a
    // release with the tag already pushed. The v3.0.0 tag failed exactly this
    // way. Registry visibility is not enough; it has to be declared.
    const publishStep = wf.jobs.publish.steps.find((step) => step.run?.includes("pnpm publish"));
    expect(publishStep?.run).toContain("--provenance");

    const pkg = JSON.parse(readFileSync(resolve(dir, "../package.json"), "utf-8")) as {
      publishConfig?: { access?: string };
    };
    expect(pkg.publishConfig?.access).toBe("public");
  });
});

describe("supply-chain cooldown", () => {
  it("T43: enforces a minimum release age rather than only listing exclusions", () => {
    // The exclusion list predates this assertion and was inert for want of the
    // key it modulates, so an install accepted a package published seconds ago.
    const ws = parse(readFileSync(resolve(dir, "../pnpm-workspace.yaml"), "utf-8")) as {
      minimumReleaseAge?: number;
    };
    expect(ws.minimumReleaseAge).toBeGreaterThan(0);
  });
});
