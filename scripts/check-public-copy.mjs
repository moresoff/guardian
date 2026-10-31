// Communication policy from moresoff/guardian's CLAUDE.md and design skill.
// This checks the running app, including its sessionless server-rendered pages.
const forbidden =
  /\b(invertir|inversi[oó]n(?:es)?|inversor(?:a|es|as)?|financia\w*|rentabilidad(?:es)?|rendimiento(?:s)?|retorno(?:s)?|tasa(?:s)?|inter[eé]s(?:es)?|cuotapart(?:e|es)|fideicomis\w*|fiduciari\w*|capital|pr[eé]stamo(?:s)?|cr[eé]dito(?:s)?|TNA|TEA)\b/giu;
const base = process.env.CHECK_PUBLIC_BASE_URL || "http://localhost:3100";
const pages = [
  "/",
  "/quienes-somos",
  "/como-participar",
  "/producer",
  "/proyectos",
  "/proyectos/pry-13",
  "/proyectos/pry-2",
  "/proyectos/pry-6",
  "/ingresar",
  "/registro",
];
let failed = false;
for (const page of pages) {
  const response = await fetch(new URL(page, base));
  const html = await response.text();
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ");
  const matches = [...new Set(text.match(forbidden) || [])];
  const economic = /(?:US\$|\bARS\b|\$\s*\d|\d\s*meses|\d\s*%)/i.test(text);
  if (!response.ok || matches.length || economic) {
    failed = true;
    console.error(
      `${page}: HTTP ${response.status} · ${matches.join(", ")}${economic ? " · condición económica visible" : ""}`,
    );
  } else console.log(`${page}: cumple la política de comunicación pública`);
}
if (failed) process.exitCode = 1;
