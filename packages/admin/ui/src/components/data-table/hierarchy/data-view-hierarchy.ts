import type {
  DataViewHierarchyConfig,
  DataViewHierarchyMoveResult,
  DataViewHierarchyRow,
  DataViewHierarchyUpdate,
} from "@eng-mohamedelsayed/admin-core/data-view";

interface HierarchyRecord<TData> {
  id: string;
  row: TData;
  index: number;
  parentId: string | null;
  order: number | null;
  orphaned: boolean;
}

function readRowId<TData>(
  row: TData,
  config: DataViewHierarchyConfig<TData>
): string | null {
  try {
    const id = config.getRowId(row);
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function readParentId<TData>(
  row: TData,
  config: DataViewHierarchyConfig<TData>
): string | null {
  try {
    const parentId = config.getParentId(row);
    return typeof parentId === "string" && parentId.length > 0
      ? parentId
      : null;
  } catch {
    return null;
  }
}

function readOrder<TData>(
  row: TData,
  config: DataViewHierarchyConfig<TData>
): number | null {
  try {
    const order = config.getOrder(row);
    return typeof order === "number" && Number.isFinite(order) ? order : null;
  } catch {
    return null;
  }
}

function compareRecords<TData>(
  left: HierarchyRecord<TData>,
  right: HierarchyRecord<TData>
): number {
  const leftOrder = left.order ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.order ?? Number.POSITIVE_INFINITY;

  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  if (left.index !== right.index) return left.index - right.index;
  return left.id.localeCompare(right.id);
}

function canonicalizeRows<TData>(
  rows: readonly TData[],
  config: DataViewHierarchyConfig<TData>
): Map<string, HierarchyRecord<TData>> {
  const records = new Map<string, HierarchyRecord<TData>>();

  rows.forEach((row, index) => {
    const id = readRowId(row, config);
    if (!id || records.has(id)) return;

    records.set(id, {
      id,
      row,
      index,
      parentId: readParentId(row, config),
      order: readOrder(row, config),
      orphaned: false,
    });
  });

  for (const record of records.values()) {
    if (record.parentId === record.id || !records.has(record.parentId ?? "")) {
      if (record.parentId !== null) record.orphaned = true;
      record.parentId = null;
    }
  }

  // Break every member of a cycle into a root. Nodes pointing at a cycle can
  // then remain valid children of one of those promoted roots.
  const resolved = new Set<string>();
  for (const start of records.values()) {
    if (resolved.has(start.id)) continue;

    const path: HierarchyRecord<TData>[] = [];
    const pathIndex = new Map<string, number>();
    let current: HierarchyRecord<TData> | undefined = start;

    while (current && !resolved.has(current.id)) {
      const cycleAt = pathIndex.get(current.id);
      if (cycleAt !== undefined) {
        for (const cyclic of path.slice(cycleAt)) {
          cyclic.parentId = null;
          cyclic.orphaned = true;
        }
        break;
      }

      pathIndex.set(current.id, path.length);
      path.push(current);
      current = current.parentId
        ? records.get(current.parentId)
        : undefined;
    }

    for (const record of path) resolved.add(record.id);
  }

  return records;
}

/** Converts flat resource rows into a deterministic, defensive hierarchy. */
export function flatToDataViewTree<TData>(
  rows: readonly TData[],
  config: DataViewHierarchyConfig<TData>
): DataViewHierarchyRow<TData>[] {
  const records = canonicalizeRows(rows, config);
  const nodes = new Map<string, DataViewHierarchyRow<TData>>();
  const childrenByParent = new Map<string | null, HierarchyRecord<TData>[]>();

  for (const record of records.values()) {
    nodes.set(record.id, {
      row: record.row,
      meta: {
        id: record.id,
        parentId: record.parentId,
        depth: 0,
        order: 0,
        orphaned: record.orphaned,
      },
      children: [],
    });

    const siblings = childrenByParent.get(record.parentId) ?? [];
    siblings.push(record);
    childrenByParent.set(record.parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareRecords);
  }

  for (const [parentId, children] of childrenByParent) {
    if (parentId === null) continue;
    const parent = nodes.get(parentId);
    if (!parent) continue;

    parent.children = children.flatMap((record, order) => {
      const child = nodes.get(record.id);
      if (!child) return [];
      child.meta.parentId = parentId;
      child.meta.order = order;
      return [child];
    });
  }

  const roots = (childrenByParent.get(null) ?? []).flatMap((record, order) => {
    const root = nodes.get(record.id);
    if (!root) return [];
    root.meta.parentId = null;
    root.meta.order = order;
    return [root];
  });

  const stack = [...roots]
    .reverse()
    .map((node) => ({ node, depth: 0 }));
  const visited = new Set<string>();

  while (stack.length > 0) {
    const next = stack.pop();
    if (!next || visited.has(next.node.meta.id)) continue;
    visited.add(next.node.meta.id);
    next.node.meta.depth = next.depth;

    for (let index = next.node.children.length - 1; index >= 0; index -= 1) {
      const child = next.node.children[index];
      if (child) stack.push({ node: child, depth: next.depth + 1 });
    }
  }

  return roots;
}

/** Flattens a tree in visual pre-order while recomputing structural metadata. */
export function flattenDataViewTree<TData>(
  tree: readonly DataViewHierarchyRow<TData>[]
): DataViewHierarchyRow<TData>[] {
  const flattened: DataViewHierarchyRow<TData>[] = [];
  const visited = new Set<string>();
  const stack: Array<{
    node: DataViewHierarchyRow<TData>;
    parentId: string | null;
    depth: number;
    order: number;
  }> = [];

  for (let index = tree.length - 1; index >= 0; index -= 1) {
    const node = tree[index];
    if (node) stack.push({ node, parentId: null, depth: 0, order: index });
  }

  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) continue;
    const id = next.node.meta.id;
    if (!id || visited.has(id)) continue;
    visited.add(id);

    flattened.push({
      row: next.node.row,
      meta: {
        ...next.node.meta,
        id,
        parentId: next.parentId,
        depth: next.depth,
        order: next.order,
      },
      children: next.node.children,
    });

    const children = Array.isArray(next.node.children)
      ? next.node.children
      : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child) {
        stack.push({
          node: child,
          parentId: id,
          depth: next.depth + 1,
          order: index,
        });
      }
    }
  }

  return flattened;
}

/** Returns true only when candidateId is below ancestorId. */
export function isDataViewDescendant<TData>(
  rows: readonly TData[],
  ancestorId: string,
  candidateId: string,
  config: DataViewHierarchyConfig<TData>
): boolean {
  if (!ancestorId || !candidateId || ancestorId === candidateId) return false;

  const parents = new Map<string, string | null>();
  for (const row of rows) {
    const id = readRowId(row, config);
    if (!id || parents.has(id)) continue;
    parents.set(id, readParentId(row, config));
  }

  const visited = new Set<string>();
  let current = parents.get(candidateId) ?? null;
  while (current && !visited.has(current)) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = parents.get(current) ?? null;
  }

  return false;
}

function noMove<TData>(
  rows: readonly TData[],
  activeId: string,
  current?: DataViewHierarchyRow<TData>
): DataViewHierarchyMoveResult<TData> {
  return {
    rows: [...rows],
    moved: {
      id: activeId,
      parentId: current?.meta.parentId ?? null,
      rank: current?.meta.order ?? 0,
    },
    updates: [],
  };
}

function permits(action: (() => boolean) | undefined): boolean {
  if (!action) return true;
  try {
    return action();
  } catch {
    return false;
  }
}

function applyUpdate<TData>(
  row: TData,
  update: DataViewHierarchyUpdate,
  config: DataViewHierarchyConfig<TData>
): TData {
  if (!config.updateRow) return row;
  try {
    return config.updateRow(row, update);
  } catch {
    return row;
  }
}

/**
 * Nests a row into a target row so it becomes a child of targetParentId.
 * If targetParentId is null, it promotes the row to a root element.
 */
export function nestDataViewHierarchyRow<TData>(
  rows: readonly TData[],
  activeId: string,
  targetParentId: string | null,
  config: DataViewHierarchyConfig<TData>
): DataViewHierarchyMoveResult<TData> {
  const flattened = flattenDataViewTree(flatToDataViewTree(rows, config));
  const byId = new Map(flattened.map((node) => [node.meta.id, node]));
  const active = byId.get(activeId);

  if (!active) {
    return noMove(rows, activeId, active);
  }

  // Cannot nest into itself
  if (targetParentId === activeId) {
    return noMove(rows, activeId, active);
  }

  // If already under targetParentId, no structural change required
  if (active.meta.parentId === targetParentId) {
    return noMove(rows, activeId, active);
  }

  // Check canDrag
  if (!permits(config.canDrag ? () => config.canDrag!(active.row) : undefined)) {
    return noMove(rows, activeId, active);
  }

  const targetParent = targetParentId ? byId.get(targetParentId) : undefined;
  if (targetParentId && !targetParent) {
    return noMove(rows, activeId, active);
  }

  // Check reparenting permission
  if (!config.allowReparent) {
    return noMove(rows, activeId, active);
  }

  if (
    !permits(
      config.canReparent
        ? () => config.canReparent!(active.row, targetParent?.row ?? null)
        : undefined
    )
  ) {
    return noMove(rows, activeId, active);
  }

  // Cycle prevention: targetParent cannot be a descendant of activeId
  if (targetParentId) {
    const visited = new Set<string>();
    let current: string | null = targetParentId;
    while (current && !visited.has(current)) {
      if (current === activeId) return noMove(rows, activeId, active);
      visited.add(current);
      current = byId.get(current)?.meta.parentId ?? null;
    }
  }

  const oldParentId = active.meta.parentId;
  const newParentId = targetParentId;

  // Build sibling map
  const siblingsByParent = new Map<string | null, string[]>();
  for (const node of flattened) {
    const siblings = siblingsByParent.get(node.meta.parentId) ?? [];
    siblings.push(node.meta.id);
    siblingsByParent.set(node.meta.parentId, siblings);
  }
  for (const siblings of siblingsByParent.values()) {
    siblings.sort(
      (left, right) =>
        (byId.get(left)?.meta.order ?? 0) - (byId.get(right)?.meta.order ?? 0)
    );
  }

  // Remove active from old parent
  const sourceSiblings = [...(siblingsByParent.get(oldParentId) ?? [])];
  const activeIndex = sourceSiblings.indexOf(activeId);
  if (activeIndex >= 0) {
    sourceSiblings.splice(activeIndex, 1);
  }
  siblingsByParent.set(oldParentId, sourceSiblings);

  // Append active to new parent as last child
  const targetSiblings = [...(siblingsByParent.get(newParentId) ?? [])];
  const targetRank = targetSiblings.length;
  targetSiblings.push(activeId);
  siblingsByParent.set(newParentId, targetSiblings);

  const updates: DataViewHierarchyUpdate[] = [];
  const seenUpdates = new Set<string>();
  const appendUpdates = (parentId: string | null, siblingIds: string[]) => {
    siblingIds.forEach((id, rank) => {
      if (seenUpdates.has(id)) return;
      seenUpdates.add(id);
      updates.push({ id, parentId, rank });
    });
  };

  appendUpdates(oldParentId, sourceSiblings);
  appendUpdates(newParentId, targetSiblings);

  const moved =
    updates.find((update) => update.id === activeId) ??
    ({ id: activeId, parentId: newParentId, rank: targetRank } as const);
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  const rowsById = new Map<string, TData>();

  for (const node of flattened) {
    const update = updatesById.get(node.meta.id);
    rowsById.set(
      node.meta.id,
      update ? applyUpdate(node.row, update, config) : node.row
    );
  }

  const optimisticRows: TData[] = [];
  const visited = new Set<string>();
  const rootIds = siblingsByParent.get(null) ?? [];
  const stack = [...rootIds].reverse();
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    const row = rowsById.get(id);
    if (row !== undefined) optimisticRows.push(row);

    const children = siblingsByParent.get(id) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const childId = children[index];
      if (childId) stack.push(childId);
    }
  }

  // Defensive fallback for any unreachable node
  for (const node of flattened) {
    if (visited.has(node.meta.id)) continue;
    const row = rowsById.get(node.meta.id);
    if (row !== undefined) optimisticRows.push(row);
  }

  return { rows: optimisticRows, moved, updates };
}

/**
 * Moves a row to the target row's sibling position or nests it into the target element.
 * Cross-parent movement uses the target's parent and is allowed only when the resource opts in.
 */
export function moveDataViewHierarchyRow<TData>(
  rows: readonly TData[],
  activeId: string,
  overId: string,
  config: DataViewHierarchyConfig<TData>,
  position?: "before" | "after" | "inside"
): DataViewHierarchyMoveResult<TData> {
  if (position === "inside") {
    return nestDataViewHierarchyRow(rows, activeId, overId, config);
  }

  const flattened = flattenDataViewTree(flatToDataViewTree(rows, config));
  const byId = new Map(flattened.map((node) => [node.meta.id, node]));
  const active = byId.get(activeId);
  const over = byId.get(overId);

  if (!active || !over || activeId === overId) {
    return noMove(rows, activeId, active);
  }
  if (!permits(config.canDrag ? () => config.canDrag!(active.row) : undefined)) {
    return noMove(rows, activeId, active);
  }
  if (
    !permits(
      config.canDrop
        ? () => config.canDrop!(active.row, over.row)
        : undefined
    )
  ) {
    return noMove(rows, activeId, active);
  }

  const oldParentId = active.meta.parentId;
  const newParentId = over.meta.parentId;
  const isReparent = oldParentId !== newParentId;

  if (isReparent && !config.allowReparent) {
    return noMove(rows, activeId, active);
  }

  const newParent = newParentId ? byId.get(newParentId) : undefined;
  if (
    isReparent &&
    !permits(
      config.canReparent
        ? () => config.canReparent!(active.row, newParent?.row ?? null)
        : undefined
    )
  ) {
    return noMove(rows, activeId, active);
  }

  if (newParentId) {
    const visited = new Set<string>();
    let current: string | null = newParentId;
    while (current && !visited.has(current)) {
      if (current === activeId) return noMove(rows, activeId, active);
      visited.add(current);
      current = byId.get(current)?.meta.parentId ?? null;
    }
  }

  const siblingsByParent = new Map<string | null, string[]>();
  for (const node of flattened) {
    const siblings = siblingsByParent.get(node.meta.parentId) ?? [];
    siblings.push(node.meta.id);
    siblingsByParent.set(node.meta.parentId, siblings);
  }
  for (const siblings of siblingsByParent.values()) {
    siblings.sort(
      (left, right) =>
        (byId.get(left)?.meta.order ?? 0) -
        (byId.get(right)?.meta.order ?? 0)
    );
  }

  const sourceSiblings = [...(siblingsByParent.get(oldParentId) ?? [])];
  const activeIndex = sourceSiblings.indexOf(activeId);
  if (activeIndex < 0) return noMove(rows, activeId, active);
  const sameParentOverIndex = sourceSiblings.indexOf(overId);
  sourceSiblings.splice(activeIndex, 1);

  const targetSiblings = isReparent
    ? [...(siblingsByParent.get(newParentId) ?? [])]
    : sourceSiblings;
  const overIndex = isReparent
    ? targetSiblings.indexOf(overId)
    : sameParentOverIndex;
  if (overIndex < 0) return noMove(rows, activeId, active);

  const insertIndex =
    position === "after"
      ? Math.min(overIndex + 1, targetSiblings.length)
      : overIndex;
  const targetRank = Math.min(insertIndex, targetSiblings.length);
  targetSiblings.splice(targetRank, 0, activeId);

  siblingsByParent.set(oldParentId, sourceSiblings);
  siblingsByParent.set(newParentId, targetSiblings);

  const updates: DataViewHierarchyUpdate[] = [];
  const seenUpdates = new Set<string>();
  const appendUpdates = (parentId: string | null, siblingIds: string[]) => {
    siblingIds.forEach((id, rank) => {
      if (seenUpdates.has(id)) return;
      seenUpdates.add(id);
      updates.push({ id, parentId, rank });
    });
  };

  if (isReparent) appendUpdates(oldParentId, sourceSiblings);
  appendUpdates(newParentId, targetSiblings);

  const moved =
    updates.find((update) => update.id === activeId) ??
    ({ id: activeId, parentId: newParentId, rank: targetRank } as const);
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  const rowsById = new Map<string, TData>();

  for (const node of flattened) {
    const update = updatesById.get(node.meta.id);
    rowsById.set(
      node.meta.id,
      update ? applyUpdate(node.row, update, config) : node.row
    );
  }

  const optimisticRows: TData[] = [];
  const visited = new Set<string>();
  const rootIds = siblingsByParent.get(null) ?? [];
  const stack = [...rootIds].reverse();
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    const row = rowsById.get(id);
    if (row !== undefined) optimisticRows.push(row);

    const children = siblingsByParent.get(id) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const childId = children[index];
      if (childId) stack.push(childId);
    }
  }

  // Defensive fallback for any malformed node that remained unreachable.
  for (const node of flattened) {
    if (visited.has(node.meta.id)) continue;
    const row = rowsById.get(node.meta.id);
    if (row !== undefined) optimisticRows.push(row);
  }

  return { rows: optimisticRows, moved, updates };
}
