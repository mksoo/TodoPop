export default {
  // 모든 Todos를 위한 키
  allTodos: () => ['todos'],
  // 특정 ID의 Todo를 위한 키 (예시 - 상세 조회 시 사용 가능)
  todoById: (args: { id: string }) => ['todoById', args] as const,
  scheduleEntries: () => ['scheduleEntries'] as const,
  scheduleEntryById: (args: { id: string }) => ['scheduleEntryById', args] as const,
}; 