import React from "react";
import styles from "./Todo.module.css";

interface TodoProps {
  id: number;
  text: string;
  onDelete: (id: number) => void;
}

const Todo: React.FC<TodoProps> = ({ id, text, onDelete }) => {
  return (
    <div className={styles.todoRow}>
      <span className={styles.dot} />
      <span className={styles.todoText}>{text}</span>
      <button className={styles.deleteBtn} onClick={() => onDelete(id)}>
        Delete
      </button>
    </div>
  );
};

export default Todo;
