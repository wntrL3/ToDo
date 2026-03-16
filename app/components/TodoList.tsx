import type { TodoItem } from "~/lib/types";
import { useState } from "react";

type Props = {
  items: TodoItem[];   // Items auf dieser Ebene
  allTodos: TodoItem[]; // Alle Items (für Sub-Tasks)
};

export function TodoList({ items, allTodos }: Props) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item) => (
        <TodoItemRow key={item.$id} item={item} allTodos={allTodos} />
      ))}
    </ul>
  );
}

function TodoItemRow({ item, allTodos }: { item: TodoItem; allTodos: TodoItem[] }) {
  const [showSubForm, setShowSubForm] = useState(false);

  // Sub-Tasks dieses Items aus allen Todos herausfiltern ← Rekursion!
  const subTasks = allTodos.filter((t) => t.parentId === item.$id);

  return (
    <li style={{ marginBottom: "8px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px", borderRadius: 6,
        background: item.completed ? "#f0fdf4" : "#f9fafb",
        border: "1px solid #e5e7eb"
      }}>

        {/* Abhaken */}
        <form method="post" style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="toggle" />
          <input type="hidden" name="id" value={item.$id} />
          <input type="hidden" name="completed" value={String(item.completed)} />
          <button type="submit" style={{
            background: "none", border: "none", cursor: "pointer", fontSize: "18px"
          }}>
            {item.completed ? "✅" : "⬜"}
          </button>
        </form>

        {/* Titel */}
        <span style={{
          flex: 1, fontSize: "14px",
          textDecoration: item.completed ? "line-through" : "none",
          color: item.completed ? "#9ca3af" : "#111"
        }}>
          {item.title}
        </span>

        {/* Sub-Task hinzufügen */}
        <button onClick={() => setShowSubForm(!showSubForm)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "12px", color: "#6b7280"
        }}>
          + Sub-Task
        </button>

        {/* Löschen */}
        <form method="post" style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={item.$id} />
          <button type="submit" style={{
            background: "none", border: "none", cursor: "pointer", color: "#ef4444"
          }}>
            🗑️
          </button>
        </form>
      </div>

      {/* Sub-Task Formular */}
      {showSubForm && (
        <form method="post" style={{ display: "flex", gap: "8px", marginTop: "6px", marginLeft: "24px" }}>
          <input type="hidden" name="intent" value="create" />
          <input type="hidden" name="parentId" value={item.$id} />
          <input
            name="title"
            placeholder="Sub-Task..."
            autoFocus
            style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #ccc", fontSize: "13px" }}
          />
          <button type="submit" style={{
            padding: "6px 12px", borderRadius: 6, border: "none",
            background: "#4f46e5", color: "white", cursor: "pointer", fontSize: "13px"
          }}>
            ＋
          </button>
        </form>
      )}

      {/* ← HIER ist die Rekursion: Sub-Tasks rendern sich selbst */}
      {subTasks.length > 0 && (
        <div style={{ marginLeft: "24px", marginTop: "6px" }}>
          <TodoList items={subTasks} allTodos={allTodos} />
        </div>
      )}
    </li>
  );
}
