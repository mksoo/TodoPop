import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTodo, updateTodo, getTodoById, deleteTodo } from '../api/todoApi';
import { Todo, RepeatSettings } from '../types/todo.types';
import { QueryKeyGenerator } from '../lib/QueryKeyGenerator';
import { calculateNextOccurrence } from '../utils/repeatUtils';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Todo를 추가하는 훅 (Mutation)
export const useAddTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string }>({
    mutationFn: async (newTodoData) => {
      // 현재 TodoListScreen에서 nextOccurrence: firestore.Timestamp.now()로 전달 중.
      // repeatSettings는 undefined로 전달됨 (옵셔널이므로).
      return addTodo({ todo: newTodoData }); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
};

// Todo의 상태를 업데이트하는 훅 (Optimistic Update 및 반복 처리 적용)
export const useUpdateTodoStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; status: Todo['status'] },
    { previousTodos?: Todo[]; previousTodo?: Todo }
  >({
    mutationFn: async ({ id, status }) => {
      const todoToUpdate = await getTodoById({ id });
      if (!todoToUpdate) throw new Error('Todo not found for status update');

      const updatesForCurrentTodo: Partial<Todo> = { status };
      let newTodoDataForRepeat: Omit<Todo, 'id' | 'createdAt'> | null = null;

      if (status === 'COMPLETED' && todoToUpdate.repeatSettings) {
        const now = firestore.Timestamp.now();
        updatesForCurrentTodo.repeatSettings = {
          ...todoToUpdate.repeatSettings,
          lastCompleted: now,
        };

        const nextOccurrenceTimestamp = calculateNextOccurrence(
          {
            repeatSettings: todoToUpdate.repeatSettings,
            lastCompleted: now,
            nextOccurrence: todoToUpdate.nextOccurrence,
          }
        );

        if (nextOccurrenceTimestamp) {
          newTodoDataForRepeat = {
            title: todoToUpdate.title,
            status: 'ONGOING',
            repeatSettings: {
              ...todoToUpdate.repeatSettings,
              lastCompleted: undefined,
            },
            nextOccurrence: nextOccurrenceTimestamp,
            dueDate: todoToUpdate.dueDate,
            googleCalendarEventId: todoToUpdate.googleCalendarEventId,
          };
        } else {
          updatesForCurrentTodo.nextOccurrence = null;
        }
      } else if (status === 'COMPLETED' && !todoToUpdate.repeatSettings) {
        // 반복 설정이 없는 할 일이 완료된 경우 (특별한 처리 불필요, 상태만 업데이트 됨)
      }
      
      const changedUpdates: Partial<Todo> = {};
      if (updatesForCurrentTodo.status !== todoToUpdate.status) {
        changedUpdates.status = updatesForCurrentTodo.status;
      }
      if (updatesForCurrentTodo.repeatSettings && todoToUpdate.repeatSettings &&
          (updatesForCurrentTodo.repeatSettings.lastCompleted?.seconds !== todoToUpdate.repeatSettings.lastCompleted?.seconds ||
           updatesForCurrentTodo.repeatSettings.lastCompleted?.nanoseconds !== todoToUpdate.repeatSettings.lastCompleted?.nanoseconds)) {
        changedUpdates.repeatSettings = updatesForCurrentTodo.repeatSettings;    
      }
      if (updatesForCurrentTodo.hasOwnProperty('nextOccurrence') && updatesForCurrentTodo.nextOccurrence !== todoToUpdate.nextOccurrence) {
        changedUpdates.nextOccurrence = updatesForCurrentTodo.nextOccurrence;
      }

      if (Object.keys(changedUpdates).length > 0) {
        await updateTodo({ id, updates: changedUpdates });
      }

      if (newTodoDataForRepeat) {
        await addTodo({ todo: newTodoDataForRepeat as Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string } });
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.allTodos() });
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });

      const previousTodos = queryClient.getQueryData<Todo[]>(QueryKeyGenerator.allTodos());
      const previousTodo = queryClient.getQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }));

      queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), (oldTodos) => {
        if (!oldTodos) return [];
        return oldTodos.map(todo =>
          todo.id === variables.id ? { ...todo, status: variables.status } : todo
        );
      });
      if (previousTodo) {
        queryClient.setQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }), 
          { ...previousTodo, status: variables.status }
        );
      }
      return { previousTodos, previousTodo };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todo[]>(QueryKeyGenerator.allTodos(), context.previousTodos);      
      }
      if (context?.previousTodo) {
        queryClient.setQueryData<Todo>(QueryKeyGenerator.todoById({ id: variables.id }), context.previousTodo);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });
    },
  });
};

// Todo를 (완료 상태 외) 업데이트하는 훅 (nextOccurrence 재계산 로직 개선)
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'status'>> & { dueDate?: FirebaseFirestoreTypes.Timestamp | null } }>({ 
    mutationFn: async ({ id, updates }) => {
      const currentTodo = await getTodoById({ id });
      if (!currentTodo) throw new Error('Todo not found for update');

      const finalUpdates: Partial<Todo> = { ...updates };

      // repeatSettings 또는 dueDate가 변경되었는지, 또는 repeatSettings가 새로 추가되었는지 확인
      const newRepeatSettings = updates.repeatSettings; // 업데이트로 전달된 새 repeatSettings
      const currentRepeatSettings = currentTodo.repeatSettings;
      // updates에서 dueDate를 직접 가져오도록 수정 (타입이 명시적으로 dueDate를 포함하도록 변경했으므로)
      const dueDateUpdate = updates.dueDate;

      let needsNextOccurrenceRecalculation = false;

      if (updates.hasOwnProperty('repeatSettings')) { // repeatSettings 자체가 변경되거나 추가/삭제된 경우
        needsNextOccurrenceRecalculation = true;
      } else if (updates.hasOwnProperty('dueDate') && currentRepeatSettings) {
        // dueDate만 변경되었고, 기존에 반복 설정이 있었던 경우
        needsNextOccurrenceRecalculation = true;
      }

      if (needsNextOccurrenceRecalculation) {
        const effectiveRepeatSettings = newRepeatSettings !== undefined ? newRepeatSettings : currentRepeatSettings;

        if (effectiveRepeatSettings) { // 유효한 반복 설정이 있는 경우에만 계산
          // 기준 날짜: 업데이트된 dueDate > 현재 dueDate > 오늘
          const referenceDateForCalc = dueDateUpdate !== undefined ? dueDateUpdate : 
                                     currentTodo.dueDate ? currentTodo.dueDate : 
                                     firestore.Timestamp.now();

          const newNextOccurrence = calculateNextOccurrence({
            repeatSettings: effectiveRepeatSettings,
            referenceDate: referenceDateForCalc, // 기준 날짜 전달
            // lastCompleted 와 nextOccurrence는 전달하지 않음으로써, referenceDate 부터 첫 발생일을 찾도록 함
          });
          finalUpdates.nextOccurrence = newNextOccurrence; // null일 수도 있음
        } else {
          // 반복 설정이 제거된 경우, nextOccurrence도 null 또는 undefined로 처리
          finalUpdates.nextOccurrence = null; 
        }
      }
      
      // status는 이 훅에서 직접 변경하지 않음 (useUpdateTodoStatus 사용)
      if (finalUpdates.hasOwnProperty('status')) {
        delete finalUpdates.status;
      }

      if (Object.keys(finalUpdates).length > 0) {
        await updateTodo({ id, updates: finalUpdates });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.todoById({ id: variables.id }) });
    },
  });
};

// Todo를 삭제하는 훅 (Mutation)
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteTodo({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.allTodos() });
    },
  });
}; 