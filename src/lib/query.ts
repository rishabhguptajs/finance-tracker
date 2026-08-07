/**
 * Build a PostgREST `or=` filter for a case-insensitive substring match.
 *
 * PostgREST parses the filter string itself, so a search term containing a
 * comma, parenthesis or quote would otherwise change the shape of the query.
 * Wrapping each value in double quotes (and escaping the characters that are
 * special *inside* those quotes) keeps the term as a single literal.
 */
export function orIlikeFilter(columns: string[], term: string): string {
  const escaped = term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return columns.map((column) => `${column}.ilike."%${escaped}%"`).join(",");
}
