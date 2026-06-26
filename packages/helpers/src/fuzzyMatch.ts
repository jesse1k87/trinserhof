// Subsequence fuzzy match: every character of `query` must appear in `text`,
// in order, but not necessarily contiguously (e.g. "jsm" matches "Jane Smith").
export const fuzzyMatch = (text: string, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const normalizedText = text.toLowerCase();
  let textIndex = 0;
  for (const char of normalizedQuery) {
    textIndex = normalizedText.indexOf(char, textIndex);
    if (textIndex === -1) return false;
    textIndex += 1;
  }
  return true;
};
