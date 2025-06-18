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
 * 할 일(Todo)의 완료 상태를 업데이트하는 React Query 뮤테이션 훅입니다.
 * 반복 설정이 있는 할 일의 경우, 완료 시 다음 반복 할 일을 생성하는 로직을 포함합니다.
 * Optimistic Update를 사용하여 UI 반응성을 개선합니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 * @see updateTodo, addTodo, getTodoById API 함수를 사용합니다.
 * @see 성공 또는 실패 시 관련 쿼리 캐시를 무효화하거나 롤백합니다.
 */
export const useUpdateTodoStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void, // 성공 시 반환 타입
    Error, // 오류 타입
    { id: string; status: Todo['status'] }, // 뮤테이션 함수 인자 타입
    { previousTodos?: Todo[]; previousTodo?: Todo } // onMutate 컨텍스트 타입
  >({
    mutationFn: async ({ id, status }) => {
      // 1. 현재 할 일 정보를 가져옵니다.
      const todoToUpdate = await getTodoById({ id });
      if (!todoToUpdate) throw new Error('Todo not found for status update');

      const updatesForCurrentTodo: Partial<Todo> = { status };
      let newTodoDataForRepeat: Omit<Todo, 'id' | 'createdAt' | 'status'> | null = null;
      
      // 3. 실제로 변경된 부분만 업데이트 (Firestore 쓰기 최소화)
      const changedUpdates: Partial<Todo> = {};
      if (updatesForCurrentTodo.status !== todoToUpdate.status) {
        changedUpdates.status = updatesForCurrentTodo.status;
      }
      if (updatesForCurrentTodo.repeatSettings && 
          JSON.stringify(updatesForCurrentTodo.repeatSettings) !== JSON.stringify(todoToUpdate.repeatSettings)) {
        changedUpdates.repeatSettings = updatesForCurrentTodo.repeatSettings;    
      }

      if (Object.keys(changedUpdates).length > 0) {
        const updatesToSend = Object.fromEntries(
          Object.entries(changedUpdates).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(updatesToSend).length > 0) {
          await updateTodo({ id, updates: updatesToSend });
        }
      }
    },
    onMutate: async (variables) => {
      // Optimistic Update: UI 즉시 반영
      // 진행 중인 관련 쿼리들을 취소하여 충돌 방지
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.allTodos() });
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });

      // 현재 캐시된 데이터 저장 (롤백 대비)
      const previousTodos = queryClient.getQueryData<Todo[]>(QueryKeyGenerator.allTodos());
      const previousTodo = queryClient.getQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }));

      // 전체 할 일 목록 캐시를 낙관적으로 업데이트
      queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), (oldTodos) => {
        if (!oldTodos) return [];
        return oldTodos.map(todo =>
          todo.id === variables.id ? { ...todo, status: variables.status } : todo
        );
      });
      // 개별 할 일 캐시도 낙관적으로 업데이트
      if (previousTodo) {
        queryClient.setQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }), 
          { ...previousTodo, status: variables.status }
        );
      }
      return { previousTodos, previousTodo }; // 컨텍스트에 이전 데이터 반환
    },
    onError: (err, variables, context) => {
      // 오류 발생 시 Optimistic Update 롤백
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), context.previousTodos);
      }
      if (context?.previousTodo) {
        queryClient.setQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }), context.previousTodo);
      }
      console.error("Error updating todo status:", err);
    },
    onSettled: (data, error, variables) => {
      // 성공/실패 여부와 관계없이 항상 관련 쿼리 무효화 (서버 데이터와 동기화)
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });
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

      // 이 훅에서는 status(완료 상태)를 직접 변경하지 않음. (useUpdateTodoStatus 훅 사용)
      if (finalUpdates.hasOwnProperty('status')) {
        delete finalUpdates.status;
      }

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