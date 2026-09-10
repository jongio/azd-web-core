import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { JSDOM } from "jsdom";
import HeroBanner from "./HeroBanner.astro";

const TITLE = 'Call any Azure API, <span class="gradient-text">already authenticated</span>';

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(HeroBanner, { props });
}

describe("HeroBanner", () => {
  it("renders titleHtml into a non-empty h1", async () => {
    const dom = new JSDOM(await render({ titleHtml: TITLE }));
    const h1 = dom.window.document.querySelector("h1");

    expect(h1).not.toBeNull();
    expect(h1?.textContent?.trim()).toBe("Call any Azure API, already authenticated");
    expect(h1?.querySelector(".gradient-text")?.textContent).toBe("already authenticated");
  });

  // Guards the defect where every consumer site passed `title` instead of
  // `titleHtml`. The wildcard `.astro` module declaration means TypeScript
  // does not check Astro component props, so this shipped a blank <h1> to
  // production on all four sites while `astro check` stayed green.
  it("throws when the title prop is misspelled as `title`", async () => {
    await expect(render({ title: TITLE })).rejects.toThrow(/titleHtml/);
  });

  it.each([
    ["undefined", undefined],
    ["empty string", ""],
    ["whitespace only", "   "],
  ])("throws when titleHtml is %s", async (_label, value) => {
    await expect(render({ titleHtml: value })).rejects.toThrow(/titleHtml/);
  });

  it("omits the subtitle paragraph when no subtitle is given", async () => {
    const dom = new JSDOM(await render({ titleHtml: TITLE }));
    expect(dom.window.document.querySelector("h1 + p")).toBeNull();
  });

  it("renders the subtitle as text, not markup", async () => {
    const dom = new JSDOM(
      await render({ titleHtml: TITLE, subtitle: "Point <b>azd rest</b> at a URL." })
    );
    const p = dom.window.document.querySelector("h1 + p");

    expect(p?.textContent).toBe("Point <b>azd rest</b> at a URL.");
    expect(p?.querySelector("b")).toBeNull();
  });
});
