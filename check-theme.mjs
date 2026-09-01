/**
 * Garde-fou du mode d'affichage : `node check-theme.mjs`
 *
 * La promesse du switch, c'est que le mode classique reste le site d'avant.
 * Elle ne tient que si TOUTE règle de css/theme.css est soit une règle du
 * switch lui-même, soit portée par html[data-theme="modern"]. Ce script
 * échoue dès qu'une règle non scopée se glisse dans le fichier.
 */

import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const fails = [];
const check = (ok, message) => { if (!ok) fails.push(message); };

// --- 1. Toute règle de theme.css est scopée ---------------------------------

const css = read("./css/theme.css").replace(/\/\*[\s\S]*?\*\//g, "");
const SWITCH_OWN = /^(\.mode-switch|\.mode-btn)\b/;

for (const [, rawSelector] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const selector = rawSelector.trim().split("\n").pop().trim();
    if (!selector || selector.startsWith("@") || selector.startsWith("}")) continue;

    for (const part of selector.split(",").map((s) => s.trim()).filter(Boolean)) {
        check(
            part.includes('html[data-theme="modern"]') || SWITCH_OWN.test(part),
            `theme.css : sélecteur non scopé, il fuiterait sur le mode classique -> "${part}"`
        );
    }
}

// Le thème moderne doit rester sous @media screen (impression = classique).
check(
    /@media\s+screen\s*\{/.test(css),
    "theme.css : le bloc @media screen a disparu, le mode moderne partirait à l'impression"
);

// --- 2. Le câblage est en place --------------------------------------------

const html = read("./index.html");
check(html.includes('href="css/theme.css"'), "index.html : css/theme.css n'est pas chargé");
check(html.includes('class="mode-switch"'), "index.html : le switch est absent de l'en-tête");
check(
    (html.match(/data-theme-value="(classic|modern)"/g) || []).length === 2,
    "index.html : il faut exactement deux boutons, data-theme-value classic et modern"
);
check(
    html.includes("localStorage.getItem('calendar_theme')"),
    "index.html : le script anti-flash du <head> a disparu"
);

const js = read("./js/app.js");
check(js.includes("function setupThemeSwitch"), "app.js : setupThemeSwitch est absent");
check(js.includes("setupThemeSwitch();"), "app.js : setupThemeSwitch n'est jamais appelé");
check(
    js.includes("setCookie(THEME_KEY"),
    "app.js : le choix du mode n'est plus mémorisé"
);

// --- Verdict ----------------------------------------------------------------

if (fails.length) {
    console.error("ÉCHEC :\n" + fails.map((f) => "  - " + f).join("\n"));
    process.exit(1);
}
console.log("OK : mode moderne entièrement scopé, switch câblé.");
