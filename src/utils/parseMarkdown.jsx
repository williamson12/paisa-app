/**
 * Lightweight Markdown → React elements converter.
 * Handles the subset that Gemini typically returns:
 *   # H1  ## H2  ### H3
 *   **bold**  *italic*
 *   - bullet  1. numbered
 *   ---  (horizontal rule)
 *   blank lines → paragraph breaks
 *
 * Returns an array of JSX elements keyed by index.
 */

/** Parse inline markdown (bold / italic) inside a string → array of spans */
function parseInline(text) {
  const parts = [];
  // Regex: **bold** | *italic*
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      // **bold**
      parts.push(
        <strong key={match.index} style={{ color: "#e4e4e7", fontWeight: 700 }}>
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(
        <em key={match.index} style={{ color: "#a1a1aa", fontStyle: "italic" }}>
          {match[3]}
        </em>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Main parser: markdown string → array of React JSX elements */
export function parseMarkdown(markdown) {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Blank line ──
    if (!line.trim()) {
      i++;
      continue;
    }

    // ── Horizontal rule ──
    if (/^---+$/.test(line.trim())) {
      elements.push(
        <hr
          key={i}
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            margin: "14px 0",
          }}
        />
      );
      i++;
      continue;
    }

    // ── Headings ──
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const fontSizes = [18, 16, 14];
      elements.push(
        <p
          key={i}
          style={{
            fontSize: fontSizes[level - 1] || 14,
            fontWeight: 800,
            color: "#C8FA64",
            marginBottom: 8,
            marginTop: elements.length > 0 ? 14 : 0,
            fontFamily: "'Bricolage Grotesque', serif",
            letterSpacing: level === 1 ? "0.01em" : "normal",
          }}
        >
          {parseInline(hMatch[2])}
        </p>
      );
      i++;
      continue;
    }

    // ── Numbered list — collect consecutive items ──
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, "");
        items.push(
          <li
            key={i}
            style={{
              fontSize: 13,
              color: "#d4d4d8",
              lineHeight: 1.75,
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            {parseInline(text)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol
          key={`ol-${i}`}
          style={{
            paddingLeft: 20,
            margin: "8px 0 12px",
            listStyleType: "decimal",
          }}
        >
          {items}
        </ol>
      );
      continue;
    }

    // ── Bullet list — collect consecutive items ──
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[-*]\s/, "");
        items.push(
          <li
            key={i}
            style={{
              fontSize: 13,
              color: "#d4d4d8",
              lineHeight: 1.75,
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            {parseInline(text)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul
          key={`ul-${i}`}
          style={{
            paddingLeft: 20,
            margin: "8px 0 12px",
            listStyleType: "disc",
          }}
        >
          {items}
        </ul>
      );
      continue;
    }

    // ── Plain paragraph ──
    elements.push(
      <p
        key={i}
        style={{
          fontSize: 13,
          color: "#a1a1aa",
          lineHeight: 1.8,
          marginBottom: 10,
        }}
      >
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}
