import { useQuery } from '@tanstack/react-query';
import { getTodoInstances, getTodoInstanceById } from '../api/todoInstanceApi';
import { TodoInstance } from '../types/todoInstance.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';

// TodoInstance 목록 조회 훅
export const useGetTodoInstances = (args: {
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  uid?: string;
} = {}) => {
  return useQuery<TodoInstance[], Error>({
    queryKey: QueryKeyGenerator.todoInstances(args),
    queryFn: () => getTodoInstances(args),
  });
};

// TodoInstance 단일 조회 훅
export const useGetTodoInstanceById = (id: string) => {
  return useQuery<TodoInstance, Error>({
    queryKey: QueryKeyGenerator.todoInstanceById({ id }),
    queryFn: () => getTodoInstanceById(id),
    enabled: !!id,
  });
}; 