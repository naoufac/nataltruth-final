// Minimal, safe markdown → HTML for blog posts. Supports headings, bold, italic,
// inline code, links, unordered + ordered lists, paragraphs, and blockquotes.
// Escapes HTML first; no raw HTML passed through. No dependencies.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text: string): string {
  let t = escapeHtml(text);
  // links [text](url) — url must be http(s) or relative
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_m, label, url) => {
    return `<a href="${url}" rel="noopener noreferrer">${label}</a>`;
  });
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return t;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      closeLists();
      const level = h[1].length + 1; // ## → h3 to keep hierarchy calm
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      closeLists();
      const quote = trimmed.replace(/^>\s?/, "");
      html.push(`<blockquote>${inline(quote)}</blockquote>`);
      i++;
      continue;
    }

    // Ordered list
    const ol = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (ol) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      i++;
      continue;
    }

    // Unordered list
    const ul = /^[-*]\s+(.*)$/.exec(trimmed);
    if (ul) {
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      i++;
      continue;
    }

    // Paragraph
    closeLists();
    html.push(`<p>${inline(trimmed)}</p>`);
    i++;
  }
  closeLists();
  return html.join("\n");
}
