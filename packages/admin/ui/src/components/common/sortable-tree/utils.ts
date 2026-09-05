import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { FlattenedItem, TreeItem } from "./types";

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex]!;
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1] as FlattenedItem;
  const nextItem = newItems[overItemIndex + 1] as FlattenedItem;
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({ previousItem });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem.id;

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth({ previousItem }: { previousItem: FlattenedItem }) {
  return previousItem ? previousItem.depth + 1 : 0;
}

function getMinDepth({ nextItem }: { nextItem: FlattenedItem }) {
  return nextItem ? nextItem.depth : 0;
}

function flatten<T extends TreeItem>(
  items: T[],
  childrenProp: string,
  parentId: UniqueIdentifier | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    const children = (item[childrenProp] || []) as T[];
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(children, childrenProp, item.id, depth + 1),
    ];
  }, []);
}

export function flattenTree<T extends TreeItem>(
  items: T[],
  childrenProp: string
): FlattenedItem[] {
  return flatten(items, childrenProp);
}

export function removeChildrenOf(
  items: FlattenedItem[],
  ids: UniqueIdentifier[],
  childrenProp: string
): FlattenedItem[] {
  const excludeParentIds = new Set(ids);
  return items.filter((item) => {
    if (item.parentId && excludeParentIds.has(item.parentId)) {
      // Also exclude this item's children
      if ((item as any)[childrenProp]?.length) {
        excludeParentIds.add(item.id);
      }
      return false;
    }
    return true;
  });
}

type ItemUpdate = {
  id: UniqueIdentifier;
  parentId: UniqueIdentifier | null;
  index: number;
};

export function buildTree<T extends TreeItem>(
  flattenedItems: FlattenedItem[],
  newIndex: number,
  childrenProp: string
): { items: T[]; update: ItemUpdate } {
  const root = { id: "root", [childrenProp]: [] } as unknown as T;
  const nodes: Record<string, T> = { [root.id as string]: root };
  const items = flattenedItems.map((item) => ({ ...item, [childrenProp]: [] }));

  let update: {
    id: UniqueIdentifier | null;
    parentId: UniqueIdentifier | null;
    index: number;
  } = { id: null, parentId: null, index: 0 };

  items.forEach((item, index) => {
    const { id, index: _index, depth: _depth, parentId: _parentId, ...rest } =
      item;
    const children = (item[childrenProp] || []) as T[];
    const parentId = _parentId ?? (root.id as UniqueIdentifier);
    const parent = (nodes[parentId as string] ?? findItem(items, parentId))!;

    nodes[id as string] = { id, [childrenProp]: children } as T;
    (parent[childrenProp] as T[]).push({
      id,
      ...rest,
      [childrenProp]: children,
    } as T);

    if (index === newIndex) {
      const parentChildren = parent[childrenProp] as FlattenedItem[];
      update = {
        id: item.id,
        parentId: parent.id === "root" ? null : parent.id,
        index: parentChildren.length - 1,
      };
    }
  });

  if (!update.id) throw new Error("Could not find updated item");

  return {
    items: root[childrenProp] as T[],
    update: update as ItemUpdate,
  };
}

export function findItem<T extends TreeItem>(
  items: T[],
  itemId: UniqueIdentifier
): T | undefined {
  return items.find(({ id }) => id === itemId);
}

export function getChildCount<T extends TreeItem>(
  items: T[],
  id: UniqueIdentifier,
  childrenProp: string
): number {
  const item = findItemDeep(items, id, childrenProp);
  return item ? countChildren(item, childrenProp) : 0;
}

function countChildren<T extends TreeItem>(
  item: T,
  childrenProp: string
): number {
  const children = (item[childrenProp] || []) as T[];
  return children.reduce(
    (acc, child) => acc + 1 + countChildren(child, childrenProp),
    0
  );
}

function findItemDeep<T extends TreeItem>(
  items: T[],
  itemId: UniqueIdentifier,
  childrenProp: string
): T | undefined {
  for (const item of items) {
    if (item.id === itemId) return item;
    const children = (item[childrenProp] || []) as T[];
    if (children.length) {
      const child = findItemDeep(children, itemId, childrenProp);
      if (child) return child;
    }
  }
}
