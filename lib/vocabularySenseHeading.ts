export type VocabularySenseHeadingInput = {
  shortLabel: string | null;
};

export const vocabularySenseHeading = (
  item: VocabularySenseHeadingInput,
): string | null => {
  const heading = item.shortLabel?.trim() ?? "";
  return heading || null;
};
