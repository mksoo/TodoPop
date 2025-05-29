import { create } from 'zustand';
import { addTodo, getTodos, updateTodo, deleteTodo } from '../api/todoApi'; // 경로 수정
import { Todo } from '../types/todo.types'; // 분리된 Todo 타입 import

export interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  handleAddTodo: (title: string) => Promise<void>;
  handleUpdateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
  handleDeleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,
  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const todos = await getTodos();
      set({ todos, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },
  handleAddTodo: async (title: string) => {
    if (!title.trim()) return;
    try {
      const newTodoId = await addTodo({ title, completed: false, failed: false });
      if (newTodoId) {
        get().fetchTodos();
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  handleUpdateTodo: async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    try {
      await updateTodo(id, updates);
      get().fetchTodos();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  handleDeleteTodo: async (id: string) => {
    try {
      await deleteTodo(id);
      get().fetchTodos();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  toggleComplete: async (id: string, completed: boolean) => {
    get().handleUpdateTodo(id, { completed });
  },
})); 