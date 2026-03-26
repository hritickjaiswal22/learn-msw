import React, { useState, useMemo, useEffect, useCallback } from "react";
import Input from "../../components/Input/Input";
import Todo from "./Todo";
import { fetchTodos, createTodo, deleteTodo } from "../../services/todoApi";
import type { TodoItem } from "../../mocks/handlers";
import styles from "./Todoapp.module.css";

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET — load todos on mount
  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch {
      setError("Failed to load todos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // POST — add a new todo
  const handleSubmit = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    try {
      setError(null);
      const newTodo = await createTodo(trimmed);
      setTodos((prev) => [...prev, newTodo]);
      setInputValue("");
    } catch {
      setError("Failed to add todo.");
    }
  };

  // DELETE — remove a todo
  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo.");
    }
  };

  const filteredTodos = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return todos;
    return todos.filter((t) => t.text.toLowerCase().includes(q));
  }, [todos, searchValue]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            My <span>Todos</span>
          </h1>
          <p className={styles.subtitle}>Stay organised, get things done.</p>
        </div>

        <div className={styles.divider} />

        {/* Search */}
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="🔍  Search todos..."
        />

        {/* Add todo row */}
        <div className={styles.inputRow}>
          <div className={styles.inputWrap}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What needs to be done?"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Add
          </button>
        </div>

        {/* Error */}
        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.divider} />

        {/* Count */}
        {!loading && todos.length > 0 && (
          <span className={styles.count}>
            {filteredTodos.length} of {todos.length} tasks
          </span>
        )}

        {/* Todo list */}
        <div className={styles.todoList}>
          {loading && <p className={styles.empty}>Loading...</p>}
          {!loading && filteredTodos.length === 0 && (
            <p className={styles.empty}>
              {searchValue
                ? "No matching todos."
                : "Nothing here yet — add a task above!"}
            </p>
          )}
          {!loading &&
            filteredTodos.map((todo) => (
              <Todo
                key={todo.id}
                id={todo.id}
                text={todo.text}
                onDelete={handleDelete}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
