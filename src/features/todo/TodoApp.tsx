import React, { useState, useMemo } from "react";
import Input from "../../components/Input/Input";
import Todo from "./Todo";
import styles from "./Todoapp.module.css";

interface TodoItem {
  id: number;
  text: string;
}

let nextId = 1;

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: nextId++, text: "Entered Todo 1" },
    { id: nextId++, text: "Entered Todo 2" },
    { id: nextId++, text: "Entered Todo 3" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, { id: nextId++, text: trimmed }]);
    setInputValue("");
  };

  const handleDelete = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
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

        <div className={styles.divider} />

        {/* Count */}
        {todos.length > 0 && (
          <span className={styles.count}>
            {filteredTodos.length} of {todos.length} tasks
          </span>
        )}

        {/* Todo list */}
        <div className={styles.todoList}>
          {filteredTodos.length === 0 && (
            <p className={styles.empty}>
              {searchValue
                ? "No matching todos."
                : "Nothing here yet — add a task above!"}
            </p>
          )}
          {filteredTodos.map((todo) => (
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
