import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodos, addTodo, updateTodo, deleteTodo } from '../../../api/todoApi';
import { Todo } from '../../../types/todo.types';

export const TODOS_QUERY_KEY = ['todos'];

// 모든 Todo를 가져오는 훅
export const useGetTodos = () => {
  return useQuery<Todo[], Error>({
    queryKey: TODOS_QUERY_KEY,
    queryFn: getTodos,
  });
};

// Todo를 추가하는 훅 (Mutation)
export const useAddTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<Todo, 'id' | 'createdAt'>>({
    mutationFn: addTodo,
    onSuccess: () => {
      // 성공 시 'todos' 쿼리를 무효화하여 다시 가져오도록 함
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

// Todo를 업데이트하는 훅 (Mutation)
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }>({
    mutationFn: ({ id, updates }) => updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

// Todo를 삭제하는 훅 (Mutation)
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
}; 