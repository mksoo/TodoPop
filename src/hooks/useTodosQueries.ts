import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';

// 모든 Todo를 가져오는 훅
export const useGetTodos = () => {
  return useQuery<Todo[], Error>({
    queryKey: QueryKeyGenerator.allTodos(),
    queryFn: getTodos,
  });
}; 