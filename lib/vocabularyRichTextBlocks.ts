/** Exact authored Markdown presentation tokens for Vocabulary learner notes.
 * No semantic inference, truncation, HTML interpretation, or synthetic content. */
export type VocabularyRichTextBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[][] }
  | { kind: "table"; headers: string[]; rows: string[][] };

const isBullet = (line: string) => /^\s*[-*]\s+\S/u.test(line);
const isPipeRow = (line: string) => /^\s*\|.*\|\s*$/u.test(line);
const cells = (line: string) => line.trim().slice(1, -1).split("|").map(value => value.trim());
const isSeparator = (line: string) =>
  isPipeRow(line) && cells(line).every(cell => /^:?-{3,}:?$/u.test(cell));
const numberedHeading = (line: string) => line.trim().match(/^\*\*([1-9]\d*\.\s+[^*\n]+)\*\*$/u);

export function parseVocabularyRichTextBlocks(source: string): VocabularyRichTextBlock[] {
  const lines = source.replace(/\r\n?/gu, "\n").split("\n");
  const blocks: VocabularyRichTextBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    const heading = numberedHeading(line);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1] });
      i += 1;
      continue;
    }
    if (isPipeRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const headers = cells(line);
      const tableLines: string[] = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && isPipeRow(lines[i]) && lines[i].trim()) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const rows = tableLines.slice(2).map(cells);
      if (headers.length > 0 && rows.every(row => row.length === headers.length)) {
        blocks.push({ kind: "table", headers, rows });
      } else {
        // Fail visibly without discarding original cells when table markup is malformed.
        blocks.push({ kind: "paragraph", lines: tableLines });
      }
      continue;
    }
    if (isBullet(line)) {
      const items: string[][] = [];
      while (i < lines.length && lines[i].trim()) {
        if (isBullet(lines[i])) {
          items.push([lines[i].replace(/^\s*[-*]\s+/u, "").trimEnd()]);
        } else if (/^\s{2,}\S/u.test(lines[i]) && items.length) {
          items[items.length - 1].push(lines[i].trim());
        } else {
          break;
        }
        i += 1;
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      if (paragraph.length && (
        numberedHeading(lines[i]) || isBullet(lines[i])
        || (isPipeRow(lines[i]) && i + 1 < lines.length && isSeparator(lines[i + 1]))
      )) break;
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: "paragraph", lines: paragraph });
  }
  return blocks;
}
