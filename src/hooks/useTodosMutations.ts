import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTodo, updateTodo, deleteTodo } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';

// Todo를 추가하는 훅 (Mutation)
export const useAddTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, { todo: Omit<Todo, 'id' | 'createdAt'> }>({
    mutationFn: ({ todo }) => addTodo({ todo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
};

// Todo의 완료 상태를 토글하는 훅 (Optimistic Update 적용)
export const useToggleTodoComplete = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; completed: boolean }, { previousTodos?: Todo[] }>({
    mutationFn: ({ id, completed }) => updateTodo({ id, updates: { completed } }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.allTodos() });
      const previousTodos = queryClient.getQueryData<Todo[]>(QueryKeyGenerator.allTodos());
      queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), (oldTodos) => {
        if (!oldTodos) return [];
        return oldTodos.map(todo =>
          todo.id === variables.id ? { ...todo, completed: variables.completed } : todo
        );
      });
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
};

// Todo를 (완료 상태 외) 업데이트하는 훅 (Optimistic Update 없음)
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }>({
    mutationFn: ({ id, updates }) => updateTodo({ id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
};

// Todo를 삭제하는 훅 (Mutation)
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteTodo({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
}; 