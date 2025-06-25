import { useQuery } from "@tanstack/react-query";
import { getScheduleEntries, getScheduleEntryById } from "@/api/scheduleEntryApi";
import QueryKeyGenerator from "@/lib/QueryKeyGenerator";

export const useScheduleEntriesQuery = () => {
  return useQuery({
    queryKey: QueryKeyGenerator.scheduleEntries(),
    queryFn: getScheduleEntries,
  })
}

export const useScheduleEntryByIdQuery = (args: { id: string }) => {
  const { id } = args;
  return useQuery({
    queryKey: QueryKeyGenerator.scheduleEntryById({ id }),
    queryFn: () => getScheduleEntryById({ id }),
  })
}