/**
 * HTML utility helpers — pure string building, no external dependencies.
 */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * HTML-escape a value. Non-strings are coerced via String().
 * @param {unknown} str
 * @returns {string}
 */
export function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ESC_MAP[/** @type {keyof ESC_MAP} */ (ch)]);
}

/**
 * Build an HTML element string.
 * @param {string} name  Tag name
 * @param {Record<string,string>} attrs  Attribute key/value pairs
 * @param {string} [content]  Inner HTML (not escaped — caller is responsible)
 * @returns {string}
 */
export function tag(name, attrs, content) {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${esc(k)}="${esc(v)}"`)
    .join('');
  if (content === undefined) return `<${name}${attrStr}>`;
  return `<${name}${attrStr}>${content}</${name}>`;
}

const CSS = `
*,*::before,*::after{box-sizing:border-box}
body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#222}
h1,h2{margin-top:0}
a{color:#0066cc}
table{border-collapse:collapse;width:100%;margin-bottom:1rem}
th,td{border:1px solid #ccc;padding:.4rem .7rem;text-align:left;vertical-align:top}
th{background:#f5f5f5}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem .75rem}
dt{font-weight:bold}
dd{margin:0}
small{color:#666}
nav{margin:.75rem 0}
nav a+a{margin-left:1rem}
p.info{color:#555}
`.trim();

/**
 * Wrap body HTML in a full HTML5 document.
 * @param {string} title  Page title (will be escaped)
 * @param {string} body   Inner HTML (not escaped)
 * @returns {string}
 */
export function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
}
