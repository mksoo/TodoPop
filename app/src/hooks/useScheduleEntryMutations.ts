import { addScheduleEntry, deleteScheduleEntry, getScheduleEntryById, updateScheduleEntry } from "@/api/scheduleEntryApi";
import QueryKeyGenerator from "@/lib/QueryKeyGenerator";
import { ScheduleEntry } from "@/types/scheduleEntry.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddScheduleEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { data: Omit<ScheduleEntry, 'id' | 'completed'> }): Promise<string> => {
      const { data } = args;
      return await addScheduleEntry({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.scheduleEntries() });
    }
  });
};

export const useUpdateScheduleEntryCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; completed: boolean }) => {
      const { id, completed } = args;
      await updateScheduleEntry({ id, data: { completed } });
    },
    onMutate: async args => {
      await queryClient.cancelQueries({ queryKey: QueryKeyGenerator.scheduleEntries() });
      const previousScheduleEntries = queryClient.getQueryData<ScheduleEntry[]>(QueryKeyGenerator.scheduleEntries());
      queryClient.setQueryData<ScheduleEntry[]>(QueryKeyGenerator.scheduleEntries(), (old: ScheduleEntry[] | undefined) => {
        if (!old) return old;
        return old.map(scheduleEntry => scheduleEntry.id === args.id ? { ...scheduleEntry, completed: args.completed } : scheduleEntry);
      });
      return { previousScheduleEntries };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<ScheduleEntry[]>(QueryKeyGenerator.scheduleEntries(), context?.previousScheduleEntries);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.scheduleEntries() });
    }
  });
};

export const useDeleteScheduleEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string }) => {
      const { id } = args;
      await deleteScheduleEntry({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyGenerator.scheduleEntries() });
    }
  });
};