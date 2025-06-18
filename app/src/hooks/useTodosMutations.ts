import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTodo, updateTodo, getTodoById, deleteTodo } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';
import { Timestamp } from '@react-native-firebase/firestore';

/**
 * 새로운 할 일(Todo)을 추가하는 React Query 뮤테이션 훅입니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 *          - `mutate`: 할 일 추가를 실행하는 함수.
 *          - `mutateAsync`: Promise를 반환하는 할 일 추가 실행 함수.
 *          - `data`: 성공 시 생성된 할 일의 ID (string).
 *          - `error`: 실패 시 `Error` 객체.
 *          - `isLoading`, `isError`, `isSuccess` 등 뮤테이션 상태.
 * @see addTodo API 함수를 사용하여 데이터를 추가합니다.
 * @see 성공 시 `QueryKeyGenerator.allTodos()` 쿼리를 무효화하여 목록을 새로고침합니다.
 */
export const useAddTodo = (args: {uid: string}) => {
  const {uid} = args;
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string }>({
    mutationFn: async (newTodoData) => {
      // newTodoData에는 title이 필수로 포함되며, dueDate, repeatSettings 등이 포함될 수 있습니다.
      // API의 addTodo 함수에서 status는 'ONGOING'으로 자동 설정됩니다.
      return addTodo({ todo: newTodoData, uid });
    },
    onSuccess: () => {
      // 할 일 추가 성공 시, 전체 할 일 목록 캐시를 무효화하여 최신 데이터를 다시 가져오도록 합니다.
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
};

/**
 * 할 일(Todo)의 내용(제목, 설명, 마감일, 반복 설정 등 완료 상태 제외)을 업데이트하는 React Query 뮤테이션 훅입니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 * @see updateTodo, getTodoById 함수를 사용합니다.
 * @see 성공 시 관련 쿼리 캐시를 무효화합니다.
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  // 뮤테이션 함수 인자 타입: id와 업데이트할 내용(updates). dueDate는 Timestamp 또는 null 허용.
  return useMutation<void, Error, { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'status'>> & { dueDate?: Timestamp | null } }>({ 
    mutationFn: async ({ id, updates }) => {
      const currentTodo = await getTodoById({ id });
      if (!currentTodo) throw new Error('Todo not found for update');

      const finalUpdates: Partial<Todo> = { ...updates };

      // 실제로 변경된 필드가 있을 경우에만 Firestore 업데이트 실행
      if (Object.keys(finalUpdates).length > 0) {
        const updatesToSend = Object.fromEntries(
          Object.entries(finalUpdates).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(updatesToSend).length > 0) {
          await updateTodo({ id, updates: updatesToSend });
        }
      }
    },
    onSuccess: (data, variables) => {
      // 성공 시, 전체 할 일 목록과 해당 할 일의 개별 캐시를 무효화
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });
    },
    onError: (err) => {
      console.error("Error updating todo:", err);
    }
  });
};

/**
 * 할 일(Todo)을 삭제하는 React Query 뮤테이션 훅입니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 * @see deleteTodo API 함수를 사용합니다.
 * @see 성공 시 `QueryKeyGenerator.allTodos()` 쿼리를 무효화하여 목록을 새로고침합니다.
 */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteTodo({ id }),
    onSuccess: () => {
      // 할 일 삭제 성공 시, 전체 할 일 목록 캐시를 무효화
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
      // 삭제된 ID에 대한 개별 캐시는 자동으로 처리될 수 있지만, 명시적으로 제거하거나 무효화할 수도 있음.
      // queryClient.removeQueries({ queryKey: QueryKeyGenerator.todoById({ id: VARIABLES.id }) }); // 예시
    },
    onError: (err) => {
      console.error("Error deleting todo:", err);
    }
  });
}; 