import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TodoList } from "./TodoList";
import type { TodoItem } from "~/lib/types";

const makeTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  $id: "1",
  title: "Test Todo",
  completed: false,
  userId: "user-1",
  ...overrides,
});

describe("TodoList", () => {
  it("renders todo titles", () => {
    const todos = [makeTodo({ title: "Buy milk" })];
    render(<TodoList items={todos} allTodos={todos} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("renders multiple todos", () => {
    const todos = [
      makeTodo({ $id: "1", title: "First task" }),
      makeTodo({ $id: "2", title: "Second task" }),
    ];
    render(<TodoList items={todos} allTodos={todos} />);
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("shows completed todo with line-through", () => {
    const todo = makeTodo({ completed: true, title: "Done task" });
    render(<TodoList items={[todo]} allTodos={[todo]} />);
    expect(screen.getByText("Done task")).toHaveStyle({ textDecoration: "line-through" });
  });

  it("shows ✅ for completed and ⬜ for open todos", () => {
    const todos = [
      makeTodo({ $id: "1", completed: true }),
      makeTodo({ $id: "2", completed: false }),
    ];
    render(<TodoList items={todos} allTodos={todos} />);
    expect(screen.getByText("✅")).toBeInTheDocument();
    expect(screen.getByText("⬜")).toBeInTheDocument();
  });

  it("shows sub-task input form after clicking '+ Sub-Task'", async () => {
    const user = userEvent.setup();
    const todo = makeTodo({ $id: "1", title: "Parent task" });
    render(<TodoList items={[todo]} allTodos={[todo]} />);

    await user.click(screen.getByText("+ Sub-Task"));
    expect(screen.getByPlaceholderText("Sub-Task...")).toBeInTheDocument();
  });

  it("renders sub-tasks nested under their parent", () => {
    const parent = makeTodo({ $id: "parent-1", title: "Parent task" });
    const child = makeTodo({ $id: "child-1", title: "Child task", parentId: "parent-1" });
    render(<TodoList items={[parent]} allTodos={[parent, child]} />);

    expect(screen.getByText("Parent task")).toBeInTheDocument();
    expect(screen.getByText("Child task")).toBeInTheDocument();
  });

  it("does not render sub-tasks as top-level items", () => {
    const parent = makeTodo({ $id: "parent-1", title: "Parent task" });
    const child = makeTodo({ $id: "child-1", title: "Child task", parentId: "parent-1" });
    // Only parent is passed as items — child should still appear via recursion
    render(<TodoList items={[parent]} allTodos={[parent, child]} />);

    const lists = screen.getAllByRole("list");
    // Root list has 1 item; child is inside a nested list
    expect(lists.length).toBeGreaterThanOrEqual(2);
  });
});
