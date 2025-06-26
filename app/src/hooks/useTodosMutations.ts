import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTodo, updateTodo, getTodoById, deleteTodo } from '../api/todoApi';
import { Todo } from '../types/todo.types';
import QueryKeyGenerator from '../lib/QueryKeyGenerator';
import { calculateNextOccurrence } from '../utils/repeatUtils';
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
      // newTodoData에는 title이 필수로 포함되며, nextOccurrence, dueDate, repeatSettings 등이 포함될 수 있습니다.
      // API의 addTodo 함수에서 nextOccurrence가 없으면 현재 시간으로, status는 'ONGOING'으로 자동 설정됩니다.
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
