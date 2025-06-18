import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addTodoInstance,
  updateTodoInstance,
  deleteTodoInstance
} from '../api/todoInstanceApi';
import { TodoInstance } from '../types/todoInstance.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';

// TodoInstance 추가 훅
export const useAddTodoInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<TodoInstance, 'id' | 'createdAt'>>({
    mutationFn: (instance) => addTodoInstance(instance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoInstances({}) });
    },
  });
};

// TodoInstance 수정 훅
export const useUpdateTodoInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Omit<TodoInstance, 'id' | 'createdAt'>> }>({
    mutationFn: ({ id, updates }) => updateTodoInstance({ id, updates }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoInstances({}) });
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoInstanceById({ id: variables.id }) });
    },
  });
};

// TodoInstance 삭제 훅
export const useDeleteTodoInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteTodoInstance({ id }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todoInstances'] });
      queryClient.invalidateQueries({ queryKey: ['todoInstance', variables.id] });
    },
  });
}; 