export function reorderDataTableRows<TData>(
  rows: TData[],
  activeId: string,
  overId: string,
  getRowId: (row: TData) => string
): TData[] {
  const oldIndex = rows.findIndex((row) => getRowId(row) === activeId);
  const newIndex = rows.findIndex((row) => getRowId(row) === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return rows;

  const next = [...rows];
  const [active] = next.splice(oldIndex, 1);
  if (active === undefined) return rows;
  next.splice(newIndex, 0, active);
  return next;
}
