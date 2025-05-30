import { useQuery } from '@tanstack/react-query';
import { getTodoById, getTodos } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';

// 모든 Todo를 가져오는 훅
export const useGetTodos = () => {
  return useQuery<Todo[], Error>({
    queryKey: QueryKeyGenerator.allTodos(),
    queryFn: getTodos,
  });
}; 

export const useGetTodoById = ({id}: {id: string}) => {
  return useQuery<Todo, Error>({
    queryKey: QueryKeyGenerator.todoById({id}),
    queryFn: () => getTodoById({id}),
  });
};