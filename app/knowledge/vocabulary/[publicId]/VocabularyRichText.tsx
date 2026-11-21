import { Fragment, type ReactNode } from "react";
import { parseVocabularyRichTextBlocks } from "@/lib/vocabularyRichTextBlocks";
import styles from "./VocabularyRichSupport.module.css";

/** Supported authored emphasis is typography only; never execute inline HTML. */
export function VocabularyRichInline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const regex = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/gu;
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(regex)) {
    const offset = match.index ?? cursor;
    if (offset > cursor) parts.push(text.slice(cursor, offset));
    if (match[1] !== undefined) parts.push(<strong key={index++}>{match[1]}</strong>);
    else parts.push(<em key={index++}>{match[2]}</em>);
    cursor = offset + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function AuthoredLines({ lines }: { lines: readonly string[] }) {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      <VocabularyRichInline text={line} />
    </Fragment>
  ));
}

export default function VocabularyRichText({ text }: { text: string }) {
  return (
    <div className={styles.richText} data-vocabulary-rich-text="v1">
      {parseVocabularyRichTextBlocks(text).map((block, index) => {
        if (block.kind === "heading") {
          return <h5 key={index} className={styles.richTextHeading}><VocabularyRichInline text={block.text} /></h5>;
        }
        if (block.kind === "list") {
          return (
            <ul key={index} className={styles.richTextList}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><AuthoredLines lines={item} /></li>
              ))}
            </ul>
          );
        }
        if (block.kind === "table") {
          return (
            <div key={index} className={styles.richTextTableScroll}>
              <table className={styles.richTextTable}>
                <thead><tr>{block.headers.map((cell, cellIndex) => (
                  <th key={cellIndex} scope="col"><VocabularyRichInline text={cell} /></th>
                ))}</tr></thead>
                <tbody>{block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((cell, cellIndex) => (
                    <td key={cellIndex}><VocabularyRichInline text={cell} /></td>
                  ))}</tr>
                ))}</tbody>
              </table>
            </div>
          );
        }
        return <p key={index} className={styles.richTextParagraph}><AuthoredLines lines={block.lines} /></p>;
      })}
    </div>
  );
}
