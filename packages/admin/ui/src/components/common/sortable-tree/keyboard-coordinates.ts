import {
  DroppableContainer,
  KeyboardCode,
  KeyboardCoordinateGetter,
  closestCorners,
  getFirstCollision,
} from "@dnd-kit/core";

import type { SensorContext } from "./types";
import { getProjection } from "./utils";

const directions: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];

const horizontal: string[] = [KeyboardCode.Left, KeyboardCode.Right];

export const sortableTreeKeyboardCoordinates: (
  context: SensorContext,
  indentationWidth: number
) => KeyboardCoordinateGetter =
  (context, indentationWidth) =>
  (
    event,
    {
      currentCoordinates,
      context: {
        active,
        over,
        collisionRect,
        droppableRects,
        droppableContainers,
      },
    }
  ) => {
    if (directions.includes(event.code)) {
      if (!active || !collisionRect) return;

      event.preventDefault();

      const {
        current: { items, offset },
      } = context;

      if (horizontal.includes(event.code) && over?.id) {
        const { depth, maxDepth, minDepth } = getProjection(
          items,
          active.id,
          over.id,
          offset,
          indentationWidth
        );

        switch (event.code) {
          case KeyboardCode.Left:
            if (depth > minDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x - indentationWidth,
              };
            }
            break;
          case KeyboardCode.Right:
            if (depth < maxDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x + indentationWidth,
              };
            }
            break;
        }
        return undefined;
      }

      const containers: DroppableContainer[] = [];

      droppableContainers.forEach((container) => {
        if (container?.disabled || container.id === over?.id) return;
        const rect = droppableRects.get(container.id);
        if (!rect) return;

        switch (event.code) {
          case KeyboardCode.Down:
            if (collisionRect.top < rect.top) containers.push(container);
            break;
          case KeyboardCode.Up:
            if (collisionRect.top > rect.top) containers.push(container);
            break;
        }
      });

      const collisions = closestCorners({
        active,
        collisionRect,
        pointerCoordinates: null,
        droppableRects,
        droppableContainers: containers,
      });

      let closestId = getFirstCollision(collisions, "id");

      if (closestId && over?.id) {
        const newNode = droppableContainers.get(closestId);
        const overNode = droppableContainers.get(over.id);

        if (newNode && overNode) {
          const newRect = droppableRects.get(newNode.id);
          const overRect = droppableRects.get(overNode.id);

          if (newRect && overRect) {
            switch (event.code) {
              case KeyboardCode.Down:
                if (newRect.top > overRect.top) closestId = over.id;
                break;
              case KeyboardCode.Up:
                if (newRect.top < overRect.top) closestId = over.id;
                break;
            }
          }
        }
      }

      if (closestId) {
        const closestRect = droppableRects.get(closestId);
        if (closestRect) {
          return {
            x: closestRect.left,
            y: closestRect.top,
          };
        }
      }
    }
    return undefined;
  };
