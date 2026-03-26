import type { TodoItem } from "../mocks/handlers";

const BASE = "/api/todos";

export async function fetchTodos(): Promise<TodoItem[]> {
  try {
    const res = await fetch(BASE);
    const json = await res.json();

    if (!res.ok) throw new Error("Failed to fetch todos");
    return json;
  } catch (error) {
    throw error;
  }
}

export async function createTodo(text: string): Promise<TodoItem> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete todo");
}
