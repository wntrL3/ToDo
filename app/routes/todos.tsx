import { data, redirect, Link } from "react-router";
import type { Route } from "./+types/todos";
import { databases, DB_ID, COLLECTION_ID } from "~/lib/appwrite.server";
// Query sorgt für filterung und Sortierung in DB Abfragen
import { ID, Query } from "node-appwrite";
// Importiert die Logik eines Item 
import type { TodoItem } from "~/lib/types";
// UI-Komponente zur Anzeige der TODOs
import { TodoList } from "~/components/TodoList";
// Funktion um aus der Request den eingeloggten User zu holen 
import { getUserId } from "~/lib/session.server";
 
// Loader, der Daten lädt bevor die Seite rendert
export async function loader({ request }: Route.LoaderArgs) {
  
  //prüft ob der User eingeloggt ist 
  const userId = getUserId(request);
  // Wenn nicht dann weiterleitung zum Login
  if (!userId) return redirect("/login");

  // Query-Parameter aus URL lesen
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  // Limit bestimmen:
  // - all -> alle bzw 5000 laden
  // - sonst Zahl aus URL -> Standard 10
  const showAll = limitParam === "all";
  const limit = showAll ? 5000 : Math.max(5, parseInt(limitParam || "10", 10));
  // Offset bestimmen: wie viele Einträge übersprungen werden
  const offset = showAll ? 0 : Math.max(0, parseInt(offsetParam || "0", 10));

  // Root-Todos laden (nur Einträge ohne parentId) mit Limit und Offset
  const rootResponse = await databases.listDocuments(DB_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.isNull("parentId"),
    Query.limit(limit),
    Query.offset(offset),
    Query.orderAsc("$createdAt"),
  ]);

  // IDs der sichtbaren Root-Todos sammeln, um nur passende Subtasks zu laden
  const rootIds = rootResponse.documents.map((doc) => doc.$id);

  // Subtasks laden, die zu den sichtbaren Root-Todos gehören
  const subResponse = rootIds.length > 0
    ? await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.equal("parentId", rootIds),
        Query.limit(5000),
        Query.orderAsc("$createdAt"),
      ])
    : { documents: [] };

  // Root-Todos und Subtasks zusammenführen
  const todos = [...rootResponse.documents, ...subResponse.documents];

  // Daten werden an die UI zurückgegeben
  return data({
    todos: todos as unknown as TodoItem[],
    limit,
    offset,
    total: rootResponse.total,
  });
}

// Action: wird ausgeführt, wenn user etwas macht
export async function action({ request }: Route.ActionArgs) {
  // Liest alle Formulardaten aus der ANfraeg
  const formData = await request.formData();

  // intent sagt welche Aktion (create, toggle, delete) ausgeführt werden soll 
  const intent = formData.get("intent") as string;
  // Holt den eingeloggten user
  const userId = getUserId(request);
  // Kein user -> ogin
  if (!userId) return redirect("/login");


  // Neues TOdo erstellen 
  if (intent === "create") {
    // Titel des Todos aus dem Formular
    const title = formData.get("title") as string;
    // Falls Subtaskt -> parent ID holen 
    const parentId = formData.get("parentId") as string | null;

    // Validierung: titel darf nicht leer sein
    if (!title?.trim()) return data({ error: "Titel fehlt" }, { status: 400 });

    // Neues Todo wird in der Datenbank erstellt
    await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
      title: title.trim(),
      completed: false,
      parentId: parentId || null,
      userId: userId,
    });
  }
  
  // Todo abhaken
  if (intent === "toggle") {
    // Id des Todos
    const id = formData.get("id") as string;
    // aktueller Status
    const completed = formData.get("completed") === "true";
    // neuen Status setzen 
    const newCompleted = !completed;

    // alle sub-tasks werden ebenfalls abgehakt
    async function toggleAllChildren(parentId: string, completed: boolean) {
      // direkten kinder des todos
      const children = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.equal("parentId", parentId),
      ]);
      for (const child of children.documents) {
        // Für jedes Kind wird der status aktualisiert
        await databases.updateDocument(DB_ID, COLLECTION_ID, child.$id, { completed });
        // rekursiv werden die Kinder der Kinder aktualisiert
        await toggleAllChildren(child.$id, completed);
      }
    }

    // Erst das angeklickte Todo selbst aktualisieren 
    await databases.updateDocument(DB_ID, COLLECTION_ID, id, {
      completed: newCompleted,
    });

    // Alle sub-tasks aktualisieren
    await toggleAllChildren(id, newCompleted);
  }

  // To do löschen 
  if (intent === "delete") {
    // holt die ID des Todos
    const id = formData.get("id") as string;
    // Löscht das Todo aus der Datenbank
    await databases.deleteDocument(DB_ID, COLLECTION_ID, id);
  }

  // COde fix für Pagination (limit)
  // liest query parameter
  const { searchParams } = new URL(request.url);
  // wandelt sie in einen String um 
  const qs = searchParams.toString();
  return redirect(qs ? `/todos?${qs}` : "/todos");
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function Todos({ loaderData }: Route.ComponentProps) {
  const { todos, limit, offset, total } = loaderData;
  const rootTodos = todos.filter((t) => !t.parentId);

  // Berechne aktuelle Seite und Gesamtseiten
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

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
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex w-full gap-2">
          {/* Zurück-Button: nur anzeigen wenn nicht auf erster Seite */}
          {hasPrev && (
            <Link
              to={`/todos?limit=${limit}&offset=${Math.max(0, offset - limit)}`}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
            >
              Zurück
            </Link>
          )}
          {/* Weiter-Button: nur anzeigen wenn es noch weitere Einträge gibt */}
          {hasNext && (
            <Link
              to={`/todos?limit=${limit}&offset=${offset + limit}`}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
            >
              Weiter
            </Link>
          )}
          <Link
            to="/todos?limit=all"
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Alle laden
          </Link>
        </div>
        {/* Seitenanzeige */}
        {total > 0 && (
          <p className="text-xs text-gray-400">
            Seite {currentPage} von {totalPages} ({total} Einträge)
          </p>
        )}
      </div>
    </div>
  );
}
