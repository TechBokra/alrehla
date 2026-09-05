import { describe, expect, it } from "vitest";
import {
  buildNotificationIdempotencyKey,
  createNotification,
  type Notification,
  type NotificationCreateCommand,
  type NotificationListQuery,
  type NotificationListResult,
  type NotificationRecipientQuery,
  type NotificationRepository,
  type NotificationRecipientResolver,
} from "../src";

const command: NotificationCreateCommand = {
  type: "order.created",
  severity: "info",
  scope: { type: "store", id: "store_a" },
  title: "New order",
  resource: { type: "order", id: "order_1" },
};

class MemoryRepository implements NotificationRepository {
  private readonly rows = new Map<string, Notification>();
  async create(
    input: NotificationCreateCommand & { idempotencyKey: string },
    recipientIds: readonly string[]
  ) {
    const notifications: Notification[] = [];
    let createdAny = false;
    for (const recipientId of recipientIds) {
      const key = `${input.idempotencyKey}:${recipientId}`;
      const existing = this.rows.get(key);
      if (existing) {
        notifications.push(existing);
        continue;
      }
      const notification: Notification = {
        id: `notification_${this.rows.size + 1}`,
        idempotencyKey: input.idempotencyKey,
        type: input.type,
        severity: input.severity,
        scope: input.scope,
        title: input.title,
        ...(input.resource ? { resource: input.resource } : {}),
        createdAt: "2026-08-29T00:00:00.000Z",
        recipient: { recipientId },
      };
      this.rows.set(key, notification);
      notifications.push(notification);
      createdAny = true;
    }
    return {
      idempotencyKey: input.idempotencyKey,
      notifications,
      created: createdAny,
    };
  }
  async list(_query: NotificationListQuery): Promise<NotificationListResult> {
    return {
      notifications: [...this.rows.values()],
      count: this.rows.size,
      limit: 20,
      offset: 0,
    };
  }
  async unreadCount(_query: NotificationRecipientQuery) {
    return this.rows.size;
  }
  async markRead(id: string, _query: NotificationRecipientQuery) {
    const value = [...this.rows.values()].find((entry) => entry.id === id);
    if (!value) throw new Error("missing");
    value.recipient.readAt = "2026-08-29T00:00:00.000Z";
    return value;
  }
  async markAllRead(_query: NotificationRecipientQuery) {
    return { updated: this.rows.size };
  }
}

const resolver: NotificationRecipientResolver = {
  async resolve() {
    return ["user_a", "user_b"];
  },
};

describe("notification core", () => {
  it("creates a generic scoped notification through ports", async () => {
    const repository = new MemoryRepository();
    const result = await createNotification(command, {
      repository,
      recipientResolver: resolver,
    });
    expect(result.idempotencyKey).toBe("store_a:order.created:order_1");
    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0]).toMatchObject({
      type: "order.created",
      scope: { type: "store", id: "store_a" },
      resource: { type: "order", id: "order_1" },
    });
  });

  it("deduplicates a retried logical event at the repository boundary", async () => {
    const repository = new MemoryRepository();
    await createNotification(command, {
      repository,
      recipientResolver: resolver,
    });
    const retry = await createNotification(command, {
      repository,
      recipientResolver: resolver,
    });
    expect(retry.notifications.map((entry) => entry.id)).toEqual([
      "notification_1",
      "notification_2",
    ]);
    expect(retry.created).toBe(false);
  });

  it("keeps persisted notifications when an optional delivery adapter fails", async () => {
    const repository = new MemoryRepository();
    const result = await createNotification(command, {
      repository,
      recipientResolver: resolver,
      delivery: {
        async deliver() {
          throw new Error("provider unavailable");
        },
      },
    });
    expect(result.notifications).toHaveLength(2);
    expect(result.deliveryFailures).toHaveLength(2);
  });

  it("namespaces non-store scopes and rejects invalid commands", async () => {
    expect(
      buildNotificationIdempotencyKey(
        { type: "organization", id: "org_a" },
        "job.completed",
        { type: "job", id: "job_1" }
      )
    ).toBe("organization:org_a:job.completed:job_1");
    await expect(
      createNotification(
        { ...command, title: "" },
        { repository: new MemoryRepository(), recipientResolver: resolver }
      )
    ).rejects.toThrow("title");
  });
});
