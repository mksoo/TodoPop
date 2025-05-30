import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTodo, updateTodo, getTodoById, deleteTodo } from '../api/todoApi';
import { Todo, RepeatSettings } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';
import { calculateNextOccurrence } from '../utils/repeatUtils';
import firestore, { FirebaseFirestoreTypes, Timestamp } from '@react-native-firebase/firestore';

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
export const useAddTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string }>({
    mutationFn: async (newTodoData) => {
      // newTodoData에는 title이 필수로 포함되며, nextOccurrence, dueDate, repeatSettings 등이 포함될 수 있습니다.
      // API의 addTodo 함수에서 nextOccurrence가 없으면 현재 시간으로, status는 'ONGOING'으로 자동 설정됩니다.
      return addTodo({ todo: newTodoData });
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

      // 2. 할 일이 'COMPLETED' 상태로 변경되고 반복 설정이 있는 경우 다음 반복 처리
      if (status === 'COMPLETED' && todoToUpdate.repeatSettings) {
        console.log('Timestamp in useUpdateTodoStatus before now():', Timestamp);
        const now = Timestamp.now();
        // 현재 완료되는 할 일의 repeatSettings 업데이트 (lastCompleted 설정)
        updatesForCurrentTodo.repeatSettings = {
          ...todoToUpdate.repeatSettings,
          lastCompleted: now,
        };

        // 다음 반복일 계산
        const nextOccurrenceTimestamp = calculateNextOccurrence({
          repeatSettings: todoToUpdate.repeatSettings, // 현재 할 일의 반복 설정 사용
          referenceDate: now, // 완료 시점을 기준으로 다음 발생일 계산
          nextOccurrence: todoToUpdate.nextOccurrence, // 현재 nextOccurrence도 참고할 수 있도록 전달
        });

        if (nextOccurrenceTimestamp) {
          // 다음 반복일이 존재하면, 새로운 반복 할 일 데이터 생성
          newTodoDataForRepeat = {
            title: todoToUpdate.title,
            description: todoToUpdate.description, // description 추가
            repeatSettings: { // 원본 반복 설정 복사 (lastCompleted는 없음)
              ...todoToUpdate.repeatSettings,
              lastCompleted: undefined, // 새로운 반복이므로 lastCompleted는 없음
            },
            nextOccurrence: nextOccurrenceTimestamp, // 계산된 다음 발생일
            dueDate: todoToUpdate.dueDate, // 기존 마감일 유지 또는 로직에 따라 변경 가능
            // googleCalendarEventId: todoToUpdate.googleCalendarEventId, // 필요시 유지
          };
        } else {
          // 다음 반복일이 없으면 (예: 반복 종료일 도달), 현재 할 일의 nextOccurrence를 null로 설정하여 반복 종료
          updatesForCurrentTodo.nextOccurrence = null;
        }
      } else if (status === 'COMPLETED' && !todoToUpdate.repeatSettings) {
        // 반복 설정 없는 일반 할 일이 완료된 경우, nextOccurrence를 null로 설정 (선택적)
        updatesForCurrentTodo.nextOccurrence = null; 
      }
      
      // 3. 실제로 변경된 부분만 업데이트 (Firestore 쓰기 최소화)
      const changedUpdates: Partial<Todo> = {};
      if (updatesForCurrentTodo.status !== todoToUpdate.status) {
        changedUpdates.status = updatesForCurrentTodo.status;
      }
      if (updatesForCurrentTodo.repeatSettings && 
          JSON.stringify(updatesForCurrentTodo.repeatSettings) !== JSON.stringify(todoToUpdate.repeatSettings)) {
        changedUpdates.repeatSettings = updatesForCurrentTodo.repeatSettings;    
      }
      if (updatesForCurrentTodo.hasOwnProperty('nextOccurrence') && 
          updatesForCurrentTodo.nextOccurrence !== todoToUpdate.nextOccurrence) {
        // Timestamp 비교는 toDate().getTime() 등으로 해야 정확하나, null 비교도 포함하여 단순 비교
        changedUpdates.nextOccurrence = updatesForCurrentTodo.nextOccurrence;
      }

      if (Object.keys(changedUpdates).length > 0) {
        const updatesToSend = Object.fromEntries(
          Object.entries(changedUpdates).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(updatesToSend).length > 0) {
          await updateTodo({ id, updates: updatesToSend });
        }
      }

      // 4. 새로운 반복 할 일이 있으면 추가
      if (newTodoDataForRepeat) {
        await addTodo({ todo: newTodoDataForRepeat as Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string } });
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
 * 마감일 또는 반복 설정 변경 시, 할 일의 `nextOccurrence`를 재계산하여 업데이트합니다.
 *
 * @returns `useMutation` 훅의 결과 객체.
 * @see updateTodo, getTodoById, calculateNextOccurrence 함수를 사용합니다.
 * @see 성공 시 관련 쿼리 캐시를 무효화합니다.
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  // 뮤테이션 함수 인자 타입: id와 업데이트할 내용(updates). dueDate는 Timestamp 또는 null 허용.
  return useMutation<void, Error, { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'status'>> & { dueDate?: Timestamp | null } }>({ 
    mutationFn: async ({ id, updates }) => {
      const currentTodo = await getTodoById({ id });
      if (!currentTodo) throw new Error('Todo not found for update');

      console.log('currentTodo', currentTodo);
      console.log('updates', updates);

      const finalUpdates: Partial<Todo> = { ...updates };

      // repeatSettings 또는 dueDate가 변경되었는지, 또는 repeatSettings가 새로 추가/삭제되었는지 확인
      const newRepeatSettings = updates.repeatSettings;
      const currentRepeatSettings = currentTodo.repeatSettings;
      const dueDateUpdate = updates.dueDate; // updates 객체에서 직접 dueDate를 가져옴

      let needsNextOccurrenceRecalculation = false;

      // 다음 발생일 재계산 필요 조건:
      // 1. repeatSettings 필드 자체가 업데이트에 포함된 경우 (추가, 변경, 삭제)
      // 2. dueDate 필드가 업데이트에 포함되었고, 현재 할 일에 반복 설정이 있는 경우
      if (updates.hasOwnProperty('repeatSettings')) {
        needsNextOccurrenceRecalculation = true;
      } else if (updates.hasOwnProperty('dueDate') && currentRepeatSettings) {
        needsNextOccurrenceRecalculation = true;
      }

      if (needsNextOccurrenceRecalculation) {
        // 적용할 반복 설정: 업데이트된 설정 > 현재 설정
        const effectiveRepeatSettings = newRepeatSettings !== undefined ? newRepeatSettings : currentRepeatSettings;

        if (effectiveRepeatSettings) { // 유효한 반복 설정(추가/변경 후)이 있는 경우
          // 다음 발생일 계산을 위한 기준 날짜 우선순위:
          // 1. 업데이트로 전달된 dueDate (dueDateUpdate)
          // 2. 현재 할 일의 dueDate (currentTodo.dueDate)
          // 3. 둘 다 없으면 현재 시간
          console.log('Timestamp in useUpdateTodo before now():', Timestamp);
          const referenceDateForCalc = dueDateUpdate !== undefined && dueDateUpdate !== null ? dueDateUpdate :
                                     currentTodo.dueDate ? currentTodo.dueDate :
                                     Timestamp.now();

          const newNextOccurrence = calculateNextOccurrence({
            repeatSettings: effectiveRepeatSettings, // 적용할 반복 설정
            referenceDate: referenceDateForCalc,     // 계산 기준일
            // nextOccurrence: currentTodo.nextOccurrence, // 기존 nextOccurrence를 전달하여 현재 주기를 고려할 수도 있으나,
                                                        // 여기서는 referenceDate부터 새로 계산하는 것이 명확함.
                                                        // (예: 마감일 변경 시, 해당 마감일부터 첫 반복 시작)
            nextOccurrence: undefined, // 명시적으로 undefined 전달하여 referenceDate부터 계산하도록 유도
            // lastCompleted는 effectiveRepeatSettings에 이미 포함되어 있을 수 있음 (수정 시)
          });
          finalUpdates.nextOccurrence = newNextOccurrence; // 계산 결과 (null일 수 있음)를 업데이트에 포함
        } else {
          // 반복 설정이 제거된 경우 (updates.repeatSettings가 null 또는 undefined로 명시적 전달)
          finalUpdates.nextOccurrence = null; // nextOccurrence도 null로 설정하여 반복 중단
        }
      }
      
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