import { data, redirect, Link } from "react-router";
import type { Route } from "./+types/todos";
import { databases, DB_ID, COLLECTION_ID } from "~/lib/appwrite.server";
import { ID, Query } from "node-appwrite";
import type { TodoItem } from "~/lib/types";
import { TodoList } from "~/components/TodoList";
import { getUserId } from "~/lib/session.server";

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const userId = getUserId(request);
  if (!userId) return redirect("/login");

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam === "all" ? 5000 : Math.max(5, parseInt(limitParam || "5", 10));

  const response = await databases.listDocuments(DB_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.limit(limit),
    Query.orderAsc("$createdAt"),
  ]);

  return data({
    todos: response.documents as unknown as TodoItem[],
    total: response.total,
    limit,
  });
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const userId = getUserId(request);
  if (!userId) return redirect("/login");

  console.log("INTENT:", intent);
  console.log("ALL FORM DATA:", Object.fromEntries(formData));

  if (intent === "create") {
    const title = formData.get("title") as string;
    const parentId = formData.get("parentId") as string | null;

    if (!title?.trim()) return data({ error: "Titel fehlt" }, { status: 400 });

     await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
      title: title.trim(),
      completed: false,
      parentId: parentId || null,
      userId: userId, 
    });
}

  if (intent === "toggle") {
  const id = formData.get("id") as string;
  const completed = formData.get("completed") === "true";
  const newCompleted = !completed;

  // Hilfsfunktion: alle Sub-Tasks eines Items rekursiv finden
  async function toggleAllChildren(parentId: string, completed: boolean) {
    try {
      const children = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.equal("parentId", parentId),
      ]);
      for (const child of children.documents) {
        await databases.updateDocument(DB_ID, COLLECTION_ID, child.$id, { completed });
        await toggleAllChildren(child.$id, completed);
      }
    } catch {
      // parentId-Index in Appwrite fehlt noch — Toggle ohne Kinder-Aktualisierung
    }
  }

  // Erst das Item selbst togglen
  await databases.updateDocument(DB_ID, COLLECTION_ID, id, {
    completed: newCompleted,
  });

  // Dann alle Kinder rekursiv
  await toggleAllChildren(id, newCompleted);
}

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await databases.deleteDocument(DB_ID, COLLECTION_ID, id);
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return redirect(qs ? `/todos?${qs}` : "/todos");
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function Todos({ loaderData }: Route.ComponentProps) {
  const { todos, limit } = loaderData;
  const rootTodos = todos.filter((t) => !t.parentId);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 style={{ margin: 0 }}>Meine To-Dos</h1>
        <form method="post" action="/logout">
          <button type="submit" style={{
            padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb",
            background: "white", color: "#6b7280", cursor: "pointer", fontSize: "13px",
          }}>
            Abmelden
          </button>
        </form>
      </div>

      <form method="post" style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input type="hidden" name="intent" value="create" />
        <input
          name="title"
          placeholder="Neues To-Do..."
          style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{
          padding: "8px 16px", borderRadius: 6, border: "none",
          background: "#4f46e5", color: "white", cursor: "pointer",
        }}>
          + Hinzufügen
        </button>
      </form>

      {rootTodos.length === 0 && (
        <p style={{ color: "#9ca3af", textAlign: "center" }}>
          Noch keine To-Dos. Füge dein erstes hinzu!
        </p>
      )}

      <TodoList items={rootTodos} allTodos={todos} />

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Link
          to={`/todos?limit=${limit + 10}`}
          style={{
            flex: 1, textAlign: "center", padding: "8px 16px", borderRadius: 6,
            border: "1px solid #4f46e5", color: "#4f46e5", textDecoration: "none", fontSize: "14px",
          }}
        >
          Nächste 10 laden
        </Link>
        <Link
          to="/todos?limit=all"
          style={{
            flex: 1, textAlign: "center", padding: "8px 16px", borderRadius: 6,
            border: "none", background: "#4f46e5", color: "white", textDecoration: "none", fontSize: "14px",
          }}
        >
          Alle laden
        </Link>
      </div>
    </div>
  );
}