export type TodoItem = {
  $id: string;        // Appwrite-ID (automatisch)
  title: string;      // Text des To-Dos
  completed: boolean; // Erledigt?
  parentId?: string;  // ID des Eltern-Items (fehlt = Top-Level)
  userId: string;     // Gehört welchem User?
};