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
    limit,
  });
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const userId = getUserId(request);
  if (!userId) return redirect("/login");

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

    async function toggleAllChildren(parentId: string, completed: boolean) {
      const children = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.equal("parentId", parentId),
      ]);
      for (const child of children.documents) {
        await databases.updateDocument(DB_ID, COLLECTION_ID, child.$id, { completed });
        await toggleAllChildren(child.$id, completed);
      }
    }

    await databases.updateDocument(DB_ID, COLLECTION_ID, id, {
      completed: newCompleted,
    });

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
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Meine To-Dos
        </h1>
        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
          >
            Abmelden
          </button>
        </form>
      </div>

      {/* New todo form */}
      <form method="post" className="mb-8 flex gap-2">
        <input type="hidden" name="intent" value="create" />
        <input
          name="title"
          placeholder="Was möchtest du erledigen?"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800"
        >
          Hinzufügen
        </button>
      </form>

      {/* Empty state */}
      {rootTodos.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">
            Noch keine To-Dos. Füge dein erstes hinzu!
          </p>
        </div>
      )}

      {/* Todo list */}
      <TodoList items={rootTodos} allTodos={todos} />

      {/* Pagination */}
      <div className="mt-6 flex gap-2">
        <Link
          to={`/todos?limit=${limit + 10}`}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
        >
          Nächste 10 laden
        </Link>
        <Link
          to="/todos?limit=all"
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Alle laden
        </Link>
      </div>
    </div>
  );
}
