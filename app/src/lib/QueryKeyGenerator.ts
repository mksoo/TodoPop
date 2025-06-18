const queryKeys = {
  todos: ['todos'] as const, // as const로 튜플 타입 유지
  todoById: (id: string) => ['todos', id] as const,
  // userProfile: ['user', 'profile'] as const,
};

export const QueryKeyGenerator = {
  // 모든 Todos를 위한 키
  allTodos: () => queryKeys.todos,
  // 특정 ID의 Todo를 위한 키 (예시 - 상세 조회 시 사용 가능)
  todoById: (args: { id: string }) => queryKeys.todoById(args.id),
  // 필요에 따라 더 많은 키 생성 함수 추가
  todoInstances: (args: { templateId?: string; startDate?: Date; endDate?: Date; status?: string; uid?: string }) => ['todoInstances', args],
  todoInstanceById: (args: { id: string }) => ['todoInstance', args.id],
}; 