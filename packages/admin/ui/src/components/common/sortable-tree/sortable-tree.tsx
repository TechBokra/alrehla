"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Announcements,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../../lib/utils";
import { sortableTreeKeyboardCoordinates } from "./keyboard-coordinates";
import { SortableTreeItem } from "./sortable-tree-item";
import {
  buildTree,
  flattenTree,
  getChildCount,
  getProjection,
  removeChildrenOf,
} from "./utils";
import type { FlattenedItem, SensorContext, TreeItem } from "./types";

const measuring = {
  droppable: { strategy: MeasuringStrategy.Always },
};

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      {
        opacity: 1,
        transform: CSS.Transform.toString(transform.initial),
      },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: "ease-out",
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

export interface SortableTreeProps<T extends { id: UniqueIdentifier }> {
  collapsible?: boolean | undefined;
  /** Name of the children array prop on each item. Default: "children" */
  childrenProp?: string | undefined;
  /** Enable drag for all items or conditionally per item */
  enableDrag?: boolean | ((item: T) => boolean) | undefined;
  items?: T[] | undefined;
  indentationWidth?: number | undefined;
  onChange: (
    updatedItem: { id: UniqueIdentifier; parentId: UniqueIdentifier | null; index: number },
    items: T[]
  ) => void;
  renderValue: (item: T) => React.ReactNode;
  renderIcon?: ((item: T) => React.ReactNode | null) | undefined;
  className?: string | undefined;
  emptyState?: React.ReactNode | undefined;
}

export function SortableTree<T extends { id: UniqueIdentifier }>({
  collapsible = true,
  childrenProp = "children",
  enableDrag = true,
  items = [],
  indentationWidth = 40,
  onChange,
  renderValue,
  renderIcon,
  className,
  emptyState,
}: SortableTreeProps<T>) {
  const [collapsedState, setCollapsedState] = React.useState<
    Record<UniqueIdentifier, boolean>
  >({});
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = React.useState(0);
  const [currentPosition, setCurrentPosition] = React.useState<{
    parentId: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);

  const flattenedItems = React.useMemo(() => {
    const flattenedTree = flattenTree(items, childrenProp);
    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, item) => {
        const { id } = item;
        const children = (item[childrenProp] || []) as FlattenedItem[];
        const collapsed = collapsedState[id];
        return collapsed && children.length ? [...acc, id] : acc;
      },
      []
    );

    return removeChildrenOf(
      flattenedTree,
      activeId ? [activeId, ...collapsedItems] : collapsedItems,
      childrenProp
    );
  }, [activeId, items, childrenProp, collapsedState]);

  const projected =
    activeId && overId
      ? getProjection(
          flattenedItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;

  const sensorContext: SensorContext = React.useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const [coordinateGetter] = React.useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indentationWidth)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  const sortedIds = React.useMemo(
    () => flattenedItems.map(({ id }) => id),
    [flattenedItems]
  );

  const activeItem = activeId
    ? flattenedItems.find(({ id }) => id === activeId)
    : null;

  React.useEffect(() => {
    sensorContext.current = { items: flattenedItems, offset: offsetLeft };
  }, [flattenedItems, offsetLeft]);

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    setActiveId(activeId);
    setOverId(activeId);

    const activeItem = flattenedItems.find(({ id }) => id === activeId);
    if (activeItem) {
      setCurrentPosition({ parentId: activeItem.parentId, overId: activeId });
    }

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();

    if (projected && over) {
      const { depth, parentId } = projected;
      const clonedItems: FlattenedItem[] = JSON.parse(
        JSON.stringify(flattenTree(items, childrenProp))
      );
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem!, depth, parentId } as FlattenedItem;

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const { items: newItems, update } = buildTree<T>(
        sortedItems,
        overIndex,
        childrenProp
      );

      onChange(update, newItems);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);
    document.body.style.setProperty("cursor", "");
  }

  function handleCollapse(id: UniqueIdentifier) {
    setCollapsedState((state) => ({
      ...state,
      [id]: !state[id],
    }));
  }

  function getMovementAnnouncement(
    eventName: string,
    activeId: UniqueIdentifier,
    overId?: UniqueIdentifier
  ) {
    if (overId && projected) {
      if (eventName !== "onDragEnd") {
        if (
          currentPosition &&
          projected.parentId === currentPosition.parentId &&
          overId === currentPosition.overId
        ) {
          return;
        } else {
          setCurrentPosition({ parentId: projected.parentId, overId });
        }
      }

      const clonedItems: FlattenedItem[] = JSON.parse(
        JSON.stringify(flattenTree(items, childrenProp))
      );
      const overIndex = clonedItems.findIndex(({ id }) => id === overId);
      const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const previousItem = sortedItems[overIndex - 1];

      let announcement: string | undefined;
      const movedVerb = eventName === "onDragEnd" ? "dropped" : "moved";
      const nestedVerb = eventName === "onDragEnd" ? "dropped" : "nested";

      if (!previousItem) {
        const nextItem = sortedItems[overIndex + 1];
        announcement = `${activeId} was ${movedVerb} before ${nextItem?.id}.`;
      } else {
        if (projected.depth > previousItem.depth) {
          announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
        } else {
          let previousSibling: FlattenedItem | undefined = previousItem;
          while (previousSibling && projected.depth < previousSibling.depth) {
            previousSibling = sortedItems.find(
              ({ id }) => id === previousSibling!.parentId
            );
          }
          if (previousSibling) {
            announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
          }
        }
      }

      return announcement;
    }
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement("onDragMove", active.id, over?.id);
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement("onDragOver", active.id, over?.id);
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement("onDragEnd", active.id, over?.id);
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`;
    },
  };

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <ul className={cn("overflow-hidden rounded-xl border border-border/80 bg-background shadow-xs", className)}>
          {flattenedItems.length === 0 ? (
            emptyState ?? (
              <li className="py-12 text-center text-sm text-muted-foreground list-none">
                No items found.
              </li>
            )
          ) : (
            flattenedItems.map((item) => {
              const { id, depth } = item;
              const children = (item[childrenProp] || []) as FlattenedItem[];
              const disabled =
                typeof enableDrag === "function"
                  ? !enableDrag(item as unknown as T)
                  : !enableDrag;

              return (
                <SortableTreeItem
                  key={id}
                  id={id}
                  value={renderValue(item as unknown as T)}
                  icon={renderIcon ? renderIcon(item as unknown as T) : undefined}
                  disabled={disabled}
                  depth={id === activeId && projected ? projected.depth : depth}
                  indentationWidth={indentationWidth}
                  collapsed={Boolean(collapsedState[id] && children.length)}
                  childCount={children.length}
                  onCollapse={
                    collapsible && children.length
                      ? () => handleCollapse(id)
                      : (undefined as never)
                  }
                />
              );
            })
          )}
        </ul>

        <React.Fragment>
          {typeof document !== "undefined"
            ? createPortal(
              <DragOverlay dropAnimation={dropAnimationConfig}>
                {activeId && activeItem ? (
                  <SortableTreeItem
                    id={activeId}
                    depth={activeItem.depth}
                    clone
                    childCount={getChildCount(items, activeId, childrenProp) + 1}
                    value={renderValue(activeItem as unknown as T)}
                    icon={renderIcon ? renderIcon(activeItem as unknown as T) : undefined}
                    indentationWidth={0}
                  />
                ) : null}
              </DragOverlay>,
              document.body
            ) : null}
        </React.Fragment>
      </SortableContext>
    </DndContext>
  );
}
