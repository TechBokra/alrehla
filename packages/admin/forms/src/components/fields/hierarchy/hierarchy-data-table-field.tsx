"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderRoot, Search } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Badge } from "@eng-mohamedelsayed/admin-ui/components/ui/badge";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { sortableTreeKeyboardCoordinates } from "@eng-mohamedelsayed/admin-ui/components/common/sortable-tree/keyboard-coordinates";
import { SortableTreeItem } from "@eng-mohamedelsayed/admin-ui/components/common/sortable-tree/sortable-tree-item";
import {
  DragHandleIcon,
  FolderIllustration,
  FolderOpenIllustration,
  TagIllustration,
} from "@eng-mohamedelsayed/admin-ui/components/common/sortable-tree/tree-icons";
import {
  buildTree,
  flattenTree,
  getChildCount,
  getProjection,
  removeChildrenOf,
  type FlattenedItem,
  type SensorContext,
  type TreeItemType,
} from "@eng-mohamedelsayed/admin-ui/components/common/sortable-tree";
import { createPortal } from "react-dom";

export interface HierarchyNodeItem {
  id: string;
  name: string;
  parentId?: string | null | undefined;
  path?: string[] | undefined;
  depth?: number | undefined;
  productCount?: number | undefined;
  itemCount?: number | undefined;
  disabled?: boolean | undefined;
}

export interface HierarchyDataTableFieldProps {
  currentId?: string | null | undefined;
  currentName?: string | undefined;
  parentCategoryId?: string | null | undefined;
  sortOrder?: number | undefined;
  items: HierarchyNodeItem[];
  onHierarchyChange?: (
    parentCategoryId: string | null,
    sortOrder: number
  ) => void;
  disabled?: boolean | undefined;
  className?: string | undefined;
  searchPlaceholder?: string | undefined;
  indentationWidth?: number;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface HierarchyTreeItem extends TreeItemType {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  isCurrent: boolean;
  order: number;
  itemCount?: number;
  isDescendant?: boolean;
  disabled?: boolean;
  children: HierarchyTreeItem[];
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDescendantIds(
  items: HierarchyNodeItem[],
  rootId: string | null | undefined
): Set<string> {
  const descendants = new Set<string>();
  if (!rootId) return descendants;

  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const item of items) {
      if (item.parentId === current && !descendants.has(item.id)) {
        descendants.add(item.id);
        queue.push(item.id);
      }
    }
  }
  return descendants;
}

/** Build nested HierarchyTreeItem[] from flat items for SortableTree */
function buildHierarchyTree(
  items: HierarchyNodeItem[],
  currentKey: string,
  currentName: string,
  currentParentId: string | null,
  currentOrder: number,
  descendantIds: Set<string>
): HierarchyTreeItem[] {
  const parentMap = new Map<string | null, HierarchyNodeItem[]>();
  const baseItems = items.filter((item) => item.id !== currentKey);

  for (const item of baseItems) {
    const pId = item.parentId ?? null;
    const list = parentMap.get(pId) ?? [];
    list.push(item);
    parentMap.set(pId, list);
  }

  // Insert current item placeholder at correct position
  const targetSiblings = parentMap.get(currentParentId) ?? [];
  const clampedOrder = Math.max(0, Math.min(currentOrder, targetSiblings.length));
  targetSiblings.splice(clampedOrder, 0, {
    id: currentKey,
    name: currentName,
    parentId: currentParentId,
  });
  parentMap.set(currentParentId, targetSiblings);

  function buildChildren(
    parentId: string | null,
    depth: number
  ): HierarchyTreeItem[] {
    const siblings = parentMap.get(parentId) ?? [];
    return siblings.map((item, index) => {
      const isCurrent = item.id === currentKey;
      const isDescendant = descendantIds.has(item.id);
      const children = isCurrent ? [] : buildChildren(item.id, depth + 1);
      return {
        id: item.id,
        name: item.name,
        parentId,
        depth,
        isCurrent,
        order: index,
        itemCount: (item as any).productCount ?? (item as any).itemCount,
        disabled: item.disabled || isDescendant,
        isDescendant,
        children,
      };
    });
  }

  return buildChildren(null, 0);
}

// ─── Component ───────────────────────────────────────────────────────────────

const CHILDREN_PROP = "children";
const INDENT_WIDTH = 40;

export function HierarchyDataTableField({
  currentId,
  currentName = "This Category",
  parentCategoryId,
  sortOrder = 0,
  items = [],
  onHierarchyChange,
  disabled = false,
  className,
  searchPlaceholder = "Filter categories...",
  indentationWidth = INDENT_WIDTH,
}: HierarchyDataTableFieldProps) {
  const currentKey = currentId || "__new_category__";
  const [filterQuery, setFilterQuery] = React.useState("");

  const [localParentId, setLocalParentId] = React.useState<string | null>(
    parentCategoryId ?? null
  );
  const [localSortOrder, setLocalSortOrder] = React.useState<number>(sortOrder ?? 0);

  // dnd-kit state
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = React.useState(0);
  const [collapsedState, setCollapsedState] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setLocalParentId(parentCategoryId ?? null);
  }, [parentCategoryId]);

  React.useEffect(() => {
    setLocalSortOrder(sortOrder ?? 0);
  }, [sortOrder]);

  const descendantIds = React.useMemo(
    () => getDescendantIds(items, currentId),
    [items, currentId]
  );

  const treeItems = React.useMemo(
    () =>
      buildHierarchyTree(
        items,
        currentKey,
        currentName,
        localParentId,
        localSortOrder,
        descendantIds
      ),
    [items, currentKey, currentName, localParentId, localSortOrder, descendantIds]
  );

  // Flatten for dnd-kit
  const flattenedItems = React.useMemo(() => {
    const flat = flattenTree(treeItems, CHILDREN_PROP);
    const collapsedItems = flat.reduce<UniqueIdentifier[]>((acc, item) => {
      const children = ((item as any)[CHILDREN_PROP] || []) as FlattenedItem[];
      return collapsedState[item.id as string] && children.length
        ? [...acc, item.id]
        : acc;
    }, []);
    return removeChildrenOf(
      flat,
      activeId ? [activeId, ...collapsedItems] : collapsedItems,
      CHILDREN_PROP
    );
  }, [treeItems, activeId, collapsedState]);

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
      : null;

  const sensorContext: SensorContext = React.useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const [coordinateGetter] = React.useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indentationWidth)
  );

  React.useEffect(() => {
    sensorContext.current = { items: flattenedItems, offset: offsetLeft };
  }, [flattenedItems, offsetLeft]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  const sortedIds = React.useMemo(
    () => flattenedItems.map(({ id }) => id),
    [flattenedItems]
  );

  const activeItem = activeId
    ? flattenedItems.find(({ id }) => id === activeId)
    : null;

  function handleDragStart({ active }: DragStartEvent) {
    if (disabled) return;
    setActiveId(active.id);
    setOverId(active.id);
    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
    document.body.style.setProperty("cursor", "");

    if (disabled || !projected || !over || active.id === over.id) return;

    // Only allow dragging the current item
    const activeFlat = flattenedItems.find(({ id }) => id === active.id);
    if (!activeFlat || (activeFlat as any).id !== currentKey) return;

    const { parentId } = projected;
    const newParentId = parentId ? String(parentId) : null;

    // Count siblings under new parent to determine rank
    const siblings = flattenedItems.filter(
      (item) => item.parentId === parentId && item.id !== currentKey
    );
    const overIdx = flattenedItems.findIndex(({ id }) => id === over.id);
    const activeIdx = flattenedItems.findIndex(({ id }) => id === active.id);
    const newOrder = overIdx > activeIdx ? siblings.length : 0;

    setLocalParentId(newParentId);
    setLocalSortOrder(newOrder);
    onHierarchyChange?.(newParentId, newOrder);
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
    document.body.style.setProperty("cursor", "");
  }

  function handleCollapse(id: UniqueIdentifier) {
    setCollapsedState((s) => ({ ...s, [String(id)]: !s[String(id)] }));
  }

  const filteredFlatItems = React.useMemo(() => {
    if (!filterQuery.trim()) return flattenedItems;
    const q = filterQuery.toLowerCase();
    return flattenedItems.filter(
      (item) =>
        String(item.id) === currentKey ||
        (item as any).name?.toLowerCase().includes(q)
    );
  }, [flattenedItems, filterQuery, currentKey]);

  const currentParentName = React.useMemo(() => {
    if (!localParentId) return "Root (Top Level)";
    const p = items.find((i) => i.id === localParentId);
    return p ? p.name : localParentId;
  }, [localParentId, items]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Status bar */}
      <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-1.5 text-xs">
        <span className="text-muted-foreground">Currently under:</span>
        <span className="font-medium text-foreground">{currentParentName}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 h-8 text-xs"
          placeholder={searchPlaceholder}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
      </div>

      {/* Root drop zone */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setLocalParentId(null);
          setLocalSortOrder(0);
          onHierarchyChange?.(null, 0);
        }}
        className={cn(
          "w-full flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all",
          localParentId === null
            ? "border-primary bg-primary/5 text-primary font-medium"
            : "border-border bg-muted/10 text-muted-foreground hover:bg-muted/30"
        )}
      >
        <FolderRoot className="h-4 w-4" />
        <span>Root Level</span>
        {localParentId === null && (
          <Badge variant="default" className="ml-auto h-4 px-1.5 text-[10px]">
            Current
          </Badge>
        )}
      </button>

      {/* Sortable Tree */}
      <div className="overflow-hidden rounded-md border bg-background max-h-[360px] overflow-y-auto">
        <DndContext
          sensors={sensors}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortedIds}
            strategy={verticalListSortingStrategy}
          >
            {filteredFlatItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No categories found.
              </div>
            ) : (
              filteredFlatItems.map((item) => {
                const typedItem = item as any;
                const isCurrent = String(item.id) === currentKey;
                const isSelectedParent = String(item.id) === localParentId;
                const children = (typedItem[CHILDREN_PROP] || []) as any[];
                const collapsedDepth = projected && item.id === activeId
                  ? projected.depth
                  : item.depth;

                return (
                  <SortableTreeItem
                    key={item.id}
                    id={item.id}
                    depth={collapsedDepth}
                    indentationWidth={indentationWidth}
                    disabled={!isCurrent || disabled}
                    collapsed={Boolean(collapsedState[String(item.id)] && children.length)}
                    childCount={children.length}
                    onCollapse={
                      children.length > 0
                        ? () => handleCollapse(item.id)
                        : undefined as never
                    }
                    value={
                      <RowLabel
                        item={typedItem}
                        isCurrent={isCurrent}
                        isSelectedParent={isSelectedParent}
                        isOver={overId === item.id && activeId !== item.id}
                        isDescendant={typedItem.isDescendant}
                        onSetParent={() => {
                          if (disabled || isCurrent || typedItem.isDescendant) return;
                          setLocalParentId(String(item.id));
                          setLocalSortOrder(0);
                          onHierarchyChange?.(String(item.id), 0);
                        }}
                      />
                    }
                  />
                );
              })
            )}
          </SortableContext>

          <React.Fragment>
            {typeof document !== "undefined"
              ? createPortal(
                <DragOverlay>
                  {activeId && activeItem ? (
                    <div className="flex items-center gap-2 rounded-md border border-primary/60 bg-background px-3 py-2 text-xs font-semibold text-primary shadow-xl opacity-90">
                      <DragHandleIcon className="text-primary" />
                      <FolderIllustration />
                      <span>{(activeItem as any).name || currentName}</span>
                      <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                        Moving
                      </Badge>
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body
              ) : null}
          </React.Fragment>

        </DndContext>
      </div>

      {/* Live projection hint */}
      {projected && activeId && (
        <p className="text-[10px] text-muted-foreground">
          Drop here to place under:{" "}
          <span className="font-medium text-foreground">
            {projected.parentId
              ? items.find((i) => i.id === projected.parentId)?.name ?? String(projected.parentId)
              : "Root"}
          </span>{" "}
          (depth {projected.depth})
        </p>
      )}
    </div>
  );
}

// ─── Row Label ────────────────────────────────────────────────────────────────

function RowLabel({
  item,
  isCurrent,
  isSelectedParent,
  isOver,
  isDescendant,
  onSetParent,
}: {
  item: any;
  isCurrent: boolean;
  isSelectedParent: boolean;
  isOver: boolean;
  isDescendant: boolean;
  onSetParent: () => void;
}) {
  const hasChildren = (item.children?.length ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={!isCurrent && !isDescendant ? onSetParent : undefined}
      className={cn(
        "flex w-full items-center gap-2 text-left",
        !isCurrent && !isDescendant && "cursor-pointer hover:text-foreground",
        isCurrent && "cursor-grab",
        isDescendant && "cursor-not-allowed opacity-50"
      )}
    >
      {/* Illustrated icon */}
      <div className="shrink-0 flex size-[15px] items-center justify-center">
        {hasChildren ? (
          isSelectedParent ? (
            <FolderOpenIllustration />
          ) : (
            <FolderIllustration />
          )
        ) : (
          <TagIllustration />
        )}
      </div>

      <span
        className={cn(
          "truncate",
          isCurrent && "text-primary font-semibold",
          isSelectedParent && !isCurrent && "text-primary font-medium",
          isDescendant && "text-muted-foreground italic"
        )}
      >
        {item.name}
      </span>

      <div className="ml-auto flex shrink-0 gap-1">
        {isCurrent && (
          <Badge variant="default" className="h-4 px-1.5 text-[10px]">
            This
          </Badge>
        )}
        {isSelectedParent && !isCurrent && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            Parent
          </Badge>
        )}
        {isOver && !isCurrent && !isDescendant && (
          <Badge
            variant="default"
            className="h-4 bg-primary px-1.5 text-[10px] animate-pulse"
          >
            Drop here
          </Badge>
        )}
        {isOver && isDescendant && (
          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
            Cannot nest
          </Badge>
        )}
        {item.itemCount !== undefined && !isCurrent && (
          <span className="text-[10px] text-muted-foreground">
            ({item.itemCount})
          </span>
        )}
      </div>
    </button>
  );
}
