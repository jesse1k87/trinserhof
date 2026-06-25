import * as React from 'react';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Reusable multi-select filter shared by the bookings and table-reservations
 * pages. Every option starts selected (i.e. "show everything"); toggling a
 * value adds/removes it from the selection.
 *
 * The filtering happens here — against the source `rows` — rather than through
 * TanStack's `columnFilters`/`getFilteredRowModel`. Feeding the table a
 * referentially-stable `data` array is what keeps it from looping: passing a
 * fresh `columnFilters` array on every render made `getFilteredRowModel`
 * recompute, which re-fired `autoResetPageIndex` -> a new pagination object ->
 * another render, forever ("Maximum update depth exceeded").
 *
 * `getValue` must be referentially stable (declare it at module scope or wrap
 * it in `useCallback`) so the memoised `filtered` list only changes when the
 * rows or the selection actually change.
 */
export const useToggleFilter = <Row, T extends string>(
  rows: Row[],
  options: readonly FilterOption<T>[],
  getValue: (row: Row) => T,
) => {
  const [selected, setSelected] = React.useState<T[]>(() => options.map((option) => option.value));

  const toggle = React.useCallback((value: T) => {
    setSelected((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }, []);

  const filtered = React.useMemo(
    () => rows.filter((row) => selected.includes(getValue(row))),
    [rows, selected, getValue],
  );

  return { selected, toggle, setSelected, filtered };
};
