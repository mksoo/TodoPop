import { useQuery } from '@tanstack/react-query';
import { getTodoById, getTodos } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import QueryKeyGenerator from '../lib/QueryKeyGenerator';

/**
 * 모든 할 일(Todo) 목록을 가져오는 React Query 훅입니다.
 * 
 * @returns `useQuery` 훅의 결과 객체.
 *          - `data`: 성공 시 `Todo[]` 타입의 할 일 목록.
 *          - `error`: 실패 시 `Error` 객체.
 *          - `isLoading`, `isError`, `isSuccess` 등 쿼리 상태를 나타내는 불리언 값들.
 * @see getTodos API 함수를 사용하여 데이터를 가져옵니다.
 * @see QueryKeyGenerator.allTodos()를 쿼리 키로 사용합니다.
 */
export const useGetTodos = (args: {uid: string}) => {
  const {uid} = args;
  return useQuery<Todo[], Error>({
    queryKey: QueryKeyGenerator.allTodos(), // 모든 Todo 목록에 대한 고유 쿼리 키
    queryFn: () => (getTodos({uid})), // 데이터를 가져올 API 함수
  });
};

/**
 * 특정 ID를 가진 할 일(Todo) 항목을 가져오는 React Query 훅입니다.
 * 
 * @param params 함수 인자 객체
 * @param params.id 가져올 할 일의 ID.
 * @returns `useQuery` 훅의 결과 객체.
 *          - `data`: 성공 시 `Todo` 타입의 할 일 객체.
 *          - `error`: 실패 시 `Error` 객체.
 *          - `isLoading`, `isError`, `isSuccess` 등 쿼리 상태.
 * @see getTodoById API 함수를 사용하여 데이터를 가져옵니다.
 * @see QueryKeyGenerator.todoById({id})를 쿼리 키로 사용합니다.
 */
export const useGetTodoById = ({ id }: { id: string }) => {
  return useQuery<Todo, Error>({
    queryKey: QueryKeyGenerator.todoById({ id }), // 특정 ID의 Todo에 대한 고유 쿼리 키
    queryFn: () => getTodoById({ id }), // 데이터를 가져올 API 함수 (ID 인자 전달)
    // enabled: !!id, // id가 있을 때만 쿼리를 실행하도록 설정 (선택 사항)
  });
};