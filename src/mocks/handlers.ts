import { http, HttpResponse } from "msw";

export interface TodoItem {
  id: number;
  text: string;
}

// In-memory store (persists for the lifetime of the browser session)
let todos: TodoItem[] = [
  { id: 1, text: "Entered Todo 1" },
  { id: 2, text: "Entered Todo 2" },
  { id: 3, text: "Entered Todo 3" },
];
let nextId = 4;

export const handlers = [
  // GET /api/todos — return all todos
  http.get("/api/todos", () => {
    return HttpResponse.json(todos);
  }),

  // POST /api/todos — accept { text }, return new todo with unique id
  http.post("/api/todos", async ({ request }) => {
    const body = (await request.json()) as { text: string };

    if (!body?.text?.trim()) {
      return HttpResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const newTodo: TodoItem = {
      id: nextId++,
      text: body.text.trim(),
    };

    todos.push(newTodo);

    return HttpResponse.json(newTodo, { status: 201 });
  }),

  // DELETE /api/todos/:id — remove todo by id
  http.delete("/api/todos/:id", ({ params }) => {
    const id = Number(params.id);
    const exists = todos.some((t) => t.id === id);

    if (!exists) {
      return HttpResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    todos = todos.filter((t) => t.id !== id);

    return HttpResponse.json({ success: true });
  }),
];
