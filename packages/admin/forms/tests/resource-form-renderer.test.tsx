import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { ResourceFormRenderer } from "../src/components/resource";
import { ResourceFormHost } from "../src/components/resource";
import {
  ResourceProvider,
  ResourceExecutionContextProvider,
  defineResource,
  useResource,
  type ResourceFormField,
} from "@eng-mohamedelsayed/admin-core/resource";
import { TestNavigationProvider } from "./test-navigation-provider";

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

interface Values {
  name: string;
  status: string;
}

type Row = { id: string; name: string };

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.string().min(1),
});

const fields = [
  {
    name: "name" as const,
    field: "Input" as const,
    label: "Name",
  },
  {
    name: "status" as const,
    field: "Select" as const,
    label: "Status",
    props: {
      options: [
        { value: "active", label: "Active" },
        { value: "draft", label: "Draft" },
      ],
    },
  },
] satisfies readonly ResourceFormField<Row, Values>[];

describe("ResourceFormRenderer", () => {
  it("renders registered fields and submits typed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResourceFormRenderer
        definition={{
          mode: "dialog",
          schema,
          defaultValues: { name: "", status: "active" },
          fields,
        }}
        mode="create"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Books");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: "Books", status: "active" })
    );
  });

  it("resolves update defaults from the record", () => {
    render(
      <ResourceFormRenderer
        definition={{
          mode: "dialog",
          schema,
          getDefaultValues: ({ record }) => ({
            name: record?.name ?? "",
            status: "draft",
          }),
          fields,
        }}
        mode="update"
        record={{ id: "1", name: "Existing" }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByRole("textbox", { name: "Name" }).getAttribute("value")
    ).toBe("Existing");
  });

  it("fails closed for an unknown serialized field identifier", () => {
    render(
      <ResourceFormRenderer
        definition={{
          mode: "dialog",
          schema,
          defaultValues: { name: "", status: "active" },
          fields: [
            ...fields,
            { name: "future_field", field: "FutureField", label: "Future field" },
          ],
        }}
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toBeTruthy();
    expect(screen.queryByText("Future field")).toBeNull();
  });

  it("renders declarative wizard steps through the shared wizard template", () => {
    render(
      <ResourceFormRenderer
        definition={{
          mode: "wizard",
          schema,
          defaultValues: { name: "", status: "active" },
          steps: [
            { id: "general", title: "General", fields },
            {
              id: "review",
              title: "Review",
              fields: [{ name: "name", field: "Input", label: "Review name" }],
            },
          ],
        }}
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "General", level: 2 })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });
});

describe("ResourceFormHost declarative presentation", () => {
  it("selects the shared sheet template for a declarative form", async () => {
    const record = { id: "1", name: "Widget" };
    const resource = defineResource<Row, Values, Values>({
      metadata: {
        name: "widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      capabilities: { create: true },
      dataView: {
        columns: [{ accessorKey: "name", header: "Name" }],
        getRowId: (row) => row.id,
      },
      forms: {
        create: {
          mode: "sheet",
          schema,
          defaultValues: { name: "", status: "active" },
          fields,
        },
      },
      mutations: {
        create: { mutationFn: vi.fn() },
      },
    });

    function OpenButton() {
      const current = useResource<typeof record, Values, Values>();
      return (
        <button type="button" onClick={current.openCreate}>
          Open
        </button>
      );
    }

    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ResourceExecutionContextProvider value={{ storeId: "store_a" }}>
          <TestNavigationProvider navigation={navigation}>
            <ResourceProvider definition={resource}>
              <OpenButton />
              <ResourceFormHost resource={resource} />
            </ResourceProvider>
          </TestNavigationProvider>
        </ResourceExecutionContextProvider>
      </QueryClientProvider>
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Create Widget" })).toBeTruthy();
  });
});
