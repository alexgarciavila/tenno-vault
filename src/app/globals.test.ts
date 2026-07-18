import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

function hasDeclaration(selector: string, declaration: RegExp) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "g"))].some((match) =>
    declaration.test(match[1] ?? ""),
  );
}

describe("globals.css — regresiones de reflow y foco móvil", () => {
  it("no impone un ancho mínimo global que fuerce scroll horizontal con zoom", () => {
    const globalViewportRules = css.match(/html\s*,\s*body\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(globalViewportRules).not.toMatch(/min-width\s*:/);
    expect(globalViewportRules).not.toMatch(/overflow-x\s*:\s*(?:clip|hidden)/);
  });

  it("reserva ante la navegación inferior el scroll de focos dentro de main", () => {
    expect(declarationBlock(":root")).toMatch(
      /--mobile-bottom-nav-clearance\s*:\s*calc\([^;]*env\(safe-area-inset-bottom\)[^;]*\)/,
    );
    expect(
      hasDeclaration("html", /scroll-padding-bottom\s*:\s*var\(--mobile-bottom-nav-clearance\)/),
    ).toBe(true);
    expect(
      hasDeclaration(
        "main :focus-visible",
        /scroll-margin-bottom\s*:\s*var\(--mobile-bottom-nav-clearance\)/,
      ),
    ).toBe(true);
  });

  it("permite que el contenido editorial largo reduzca y haga wrap en reflow estrecho", () => {
    const header = declarationBlock(".editorial-page-header");
    const copy = declarationBlock(".editorial-page-header__copy");

    expect(header).toMatch(/min-width\s*:\s*0\s*;/);
    expect(copy).toMatch(/min-width\s*:\s*0\s*;/);
    expect(copy).toMatch(/max-width\s*:\s*100%\s*;/);
    expect(copy).toMatch(/white-space\s*:\s*normal\s*;/);
    expect(copy).toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    expect(copy).not.toMatch(/word-break\s*:\s*(?:break-all|keep-all)\s*;/);
  });

  it("permite partir dominios y etiquetas de enlaces externos sin alterar su semántica", () => {
    const legalCopy = declarationBlock(".legal-copy");
    const externalLink = declarationBlock(".external-link");
    const externalLabel = declarationBlock(".external-link__label");

    expect(legalCopy).toMatch(/min-width\s*:\s*0\s*;/);
    expect(legalCopy).toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    expect(legalCopy).not.toMatch(/word-break\s*:\s*(?:break-all|keep-all)\s*;/);
    expect(externalLink).toMatch(/max-width\s*:\s*100%\s*;/);
    expect(externalLink).toMatch(/min-width\s*:\s*0\s*;/);
    expect(externalLabel).toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
  });

  it("apila el título a ancho completo y el badge debajo a la izquierda en todas las cards", () => {
    const header = declarationBlock(".weapon-card__header");
    const name = declarationBlock(".weapon-card__name");
    const category = declarationBlock(".weapon-card__category");

    // Columna: título arriba (fila propia), badge debajo (fila propia). Al
    // apilar en vertical, título y badge no pueden solaparse en ningún ancho.
    expect(header).toMatch(/display\s*:\s*flex\s*;/);
    expect(header).toMatch(/flex-direction\s*:\s*column\s*;/);
    // Título a ancho completo, envuelve por palabras, sin partir a mitad.
    expect(name).toMatch(/align-self\s*:\s*stretch\s*;/);
    expect(name).toMatch(/overflow-wrap\s*:\s*normal\s*;/);
    expect(name).not.toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    // Badge en su propia fila, pegado a la izquierda, ajustado a su contenido.
    expect(category).toMatch(/align-self\s*:\s*flex-start\s*;/);
  });

  it("no parte los títulos display a mitad de palabra fuera del modo extremo", () => {
    const displayTitle = declarationBlock(".display-title");
    const pageTitle = declarationBlock(".editorial-page-header__title");

    expect(displayTitle).toMatch(/overflow-wrap\s*:\s*normal\s*;/);
    expect(displayTitle).toMatch(/word-break\s*:\s*normal\s*;/);
    expect(displayTitle).not.toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    expect(pageTitle).toMatch(/overflow-wrap\s*:\s*normal\s*;/);
    expect(pageTitle).not.toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
  });

  it("permite partir los títulos display solo como último recurso a ≤240px", () => {
    const extreme = css.match(/@media\s*\(max-width:\s*240px\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? "";
    expect(extreme).toMatch(
      /\.display-title\s*,\s*\.weapon-card__name\s*,\s*\.editorial-page-header__title\s*\{[\s\S]*?overflow-wrap\s*:\s*anywhere/,
    );
  });

  it("neutraliza mínimos intrínsecos y mantiene fieldset/legend compresibles", () => {
    expect(declarationBlock(".reflow-chain")).toMatch(/min-width\s*:\s*0\s*;/);
    expect(declarationBlock(".reflow-chain")).toMatch(/max-width\s*:\s*100%\s*;/);
    expect(declarationBlock(".reflow-text")).toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    expect(css).toMatch(
      /fieldset\.reflow-chain\s*,\s*fieldset\.reflow-chain\s*>\s*legend\s*\{[\s\S]*?min-inline-size\s*:\s*0\s*;[\s\S]*?max-inline-size\s*:\s*100%\s*;/,
    );
  });

  it("recompone el stepper en 2×2 por ancho disponible sin reducir sus botones", () => {
    expect(declarationBlock(".copy-stepper")).toMatch(/container-type\s*:\s*inline-size\s*;/);
    expect(css).toMatch(/@container\s*\(max-width:\s*127px\)/);
    expect(css).toMatch(/grid-template-columns\s*:\s*repeat\(2,\s*44px\)/);
    expect(css).toMatch(/\.copy-stepper__value\s*\{[\s\S]*?grid-column\s*:\s*1\s*\/\s*-1/);
    expect(declarationBlock(".copy-stepper")).not.toMatch(/overflow\s*:\s*(?:clip|hidden)/);
    expect(declarationBlock(".copy-stepper__controls")).not.toMatch(
      /overflow\s*:\s*(?:clip|hidden)/,
    );
  });

  it("aplica un único modo extremo a 240 px con el presupuesto acordado", () => {
    const extreme = css.match(/@media\s*\(max-width:\s*240px\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? "";
    expect(extreme).toMatch(/main\s*\{[\s\S]*?padding-right\s*:\s*8px\s*!important/);
    expect(extreme).toMatch(/\.extreme-panel\s*,\s*\.extreme-tier\s*\{[\s\S]*?8px/);
    expect(extreme).toMatch(/\.extreme-variant\s*\{[\s\S]*?4px/);
    expect(extreme).toMatch(/\.extreme-perk-option\s*\{[\s\S]*?gap\s*:\s*4px/);
  });
});
