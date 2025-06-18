import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addTodoInstance,
  updateTodoInstance,
  deleteTodoInstance,
  getTodoInstanceById
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

/**
 * 할 일(Todo)의 완료 상태를 업데이트하는 React Query 뮤테이션 훅입니다.
 * 반복 설정이 있는 할 일의 경우, 완료 시 다음 반복 할 일을 생성하는 로직을 포함합니다.
 * Optimistic Update를 사용하여 UI 반응성을 개선합니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 * @see updateTodo, addTodo, getTodoById API 함수를 사용합니다.
 * @see 성공 또는 실패 시 관련 쿼리 캐시를 무효화하거나 롤백합니다.
 */
export const useUpdateTodoInstanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void, // 성공 시 반환 타입
    Error, // 오류 타입
    { id: string; status: TodoInstance['status'] }, // 뮤테이션 함수 인자 타입
    { previousTodos?: TodoInstance[]; previousTodo?: TodoInstance } // onMutate 컨텍스트 타입
  >({
    mutationFn: async ({ id, status }) => {
      // 1. 현재 할 일 정보를 가져옵니다.
      const todoInstanceToUpdate = await getTodoInstanceById({ id });
      if (!todoInstanceToUpdate) throw new Error('TodoInstance not found for status update');

      const updatesForCurrentTodo: Partial<TodoInstance> = { status };
      let newTodoDataForRepeat: Omit<TodoInstance, 'id' | 'createdAt' | 'status'> | null = null;
      
      // 3. 실제로 변경된 부분만 업데이트 (Firestore 쓰기 최소화)
      const changedUpdates: Partial<TodoInstance> = {};
      if (updatesForCurrentTodo.status !== todoInstanceToUpdate.status) {
        changedUpdates.status = updatesForCurrentTodo.status;
      }

      if (Object.keys(changedUpdates).length > 0) {
        const updatesToSend = Object.fromEntries(
          Object.entries(changedUpdates).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(updatesToSend).length > 0) {
          await updateTodoInstance({ id, updates: updatesToSend });
        }
      }
    },
    onMutate: async (variables) => {
      // Optimistic Update: UI 즉시 반영
      // 진행 중인 관련 쿼리들을 취소하여 충돌 방지
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.allTodos() });
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });

      // 현재 캐시된 데이터 저장 (롤백 대비)
      const previousTodos = queryClient.getQueryData<TodoInstance[]>(QueryKeyGenerator.allTodos());
      const previousTodo = queryClient.getQueryData<TodoInstance>(QueryKeyGenerator.todoById({ id: variables.id }));

      // 전체 할 일 목록 캐시를 낙관적으로 업데이트
      queryClient.setQueryData<TodoInstance[]>(QueryKeyGenerator.allTodos(), (oldTodos) => {
        if (!oldTodos) return [];
        return oldTodos.map(todo =>
          todo.id === variables.id ? { ...todo, status: variables.status } : todo
        );
      });
      // 개별 할 일 캐시도 낙관적으로 업데이트
      if (previousTodo) {
        queryClient.setQueryData<TodoInstance>(QueryKeyGenerator.todoById({ id: variables.id }), 
          { ...previousTodo, status: variables.status }
        );
      }
      return { previousTodos, previousTodo }; // 컨텍스트에 이전 데이터 반환
    },
    onError: (err, variables, context) => {
      // 오류 발생 시 Optimistic Update 롤백
      if (context?.previousTodos) {
        queryClient.setQueryData<TodoInstance[]>(QueryKeyGenerator.allTodos(), context.previousTodos);
      }
      if (context?.previousTodo) {
        queryClient.setQueryData<TodoInstance>(QueryKeyGenerator.todoById({ id: variables.id }), context.previousTodo);
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