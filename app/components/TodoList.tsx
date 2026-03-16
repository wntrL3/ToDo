import type { TodoItem } from "~/lib/types";
import { useState } from "react";

type Props = {
  items: TodoItem[];
  allTodos: TodoItem[];
};

export function TodoList({ items, allTodos }: Props) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <TodoItemRow key={item.$id} item={item} allTodos={allTodos} />
      ))}
    </ul>
  );
}

function TodoItemRow({ item, allTodos }: { item: TodoItem; allTodos: TodoItem[] }) {
  const [showSubForm, setShowSubForm] = useState(false);
  const subTasks = allTodos.filter((t) => t.parentId === item.$id);

  return (
    <li>
      <div
        className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          item.completed
            ? "border-emerald-200 bg-emerald-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        {/* Toggle */}
        <form method="post">
          <input type="hidden" name="intent" value="toggle" />
          <input type="hidden" name="id" value={item.$id} />
          <input type="hidden" name="completed" value={String(item.completed)} />
          <button
            type="submit"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              item.completed
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            {item.completed && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </form>

        {/* Title */}
        <span
          className={`flex-1 text-sm transition-colors ${
            item.completed ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {item.title}
        </span>

        {/* Sub-Task toggle */}
        <button
          onClick={() => setShowSubForm(!showSubForm)}
          className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100"
        >
          + Sub-Task
        </button>

        {/* Delete */}
        <form method="post">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={item.$id} />
          <button
            type="submit"
            className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </form>
      </div>

      {/* Sub-Task form */}
      {showSubForm && (
        <form method="post" className="ml-8 mt-2 flex gap-2">
          <input type="hidden" name="intent" value="create" />
          <input type="hidden" name="parentId" value={item.$id} />
          <input
            name="title"
            placeholder="Sub-Task hinzufügen..."
            autoFocus
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Hinzufügen
          </button>
        </form>
      )}

      {/* Recursive sub-tasks */}
      {subTasks.length > 0 && (
        <div className="ml-8 mt-2">
          <TodoList items={subTasks} allTodos={allTodos} />
        </div>
      )}
    </li>
  );
}
