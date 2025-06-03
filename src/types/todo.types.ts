import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * 할 일의 완료 상태를 나타내는 타입입니다.
 * - ONGOING: 진행 중
 * - COMPLETED: 완료됨
 * - PENDING: 보류 (아직 사용되지 않음, 향후 확장을 위해 포함 가능)
 */
export type TodoStatus = 'ONGOING' | 'COMPLETED' | 'PENDING';

/**
 * 할 일의 반복 빈도를 나타내는 타입입니다.
 * - daily: 매일
 * - weekly: 매주
 * - monthly: 매월
 * - custom: 사용자 정의 간격 (예: X일마다, X주마다 등은 interval로 제어)
 */
export type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * 할 일의 반복 설정을 정의하는 인터페이스입니다.
 */
export interface RepeatSettings {
  /** 반복 빈도 (daily, weekly, monthly, custom) */
  frequency: RepeatFrequency;
  /** 매주 반복 시 요일 설정 (0: 일요일, 1: 월요일, ..., 6: 토요일) */
  daysOfWeek?: number[]; 
  /** 매월 반복 시 날짜 설정 (1-31) */
  daysOfMonth?: number[];
  /** 사용자 정의 반복 시 간격 (예: frequency가 'custom'이고 interval이 2면 2일마다 또는 2주마다 등) */
  interval?: number; 
  /** 반복 종료일 (선택 사항) */
  endDate?: FirebaseFirestoreTypes.Timestamp | null;
  /** 
   * 마지막으로 이 반복 할 일이 "완료" 처리된 시각입니다. (선택 사항)
   * 이 값은 다음 할 일 생성 시 참조되며, 새롭게 생성된 반복 할 일에는 이 값이 없습니다.
   * 즉, 이 반복 패턴으로 생성된 인스턴스 중 가장 최근 완료된 것의 완료 시각.
   */
  lastCompleted?: FirebaseFirestoreTypes.Timestamp;
}

/**
 * 기본 할 일(Todo) 객체의 구조를 정의하는 인터페이스입니다.
 */
export interface Todo {
  /** Firestore 문서 ID */
  id: string; 
  /** 할 일 제목 */
  title: string; 
  /** 할 일 내용 (선택 사항) */
  description?: string; 
  /** 할 일 상태 (ONGOING, COMPLETED, PENDING) */
  status: TodoStatus;
  /** 생성일 */
  createdAt: FirebaseFirestoreTypes.Timestamp;
  /** 완료일 (선택 사항) */
  completedAt?: FirebaseFirestoreTypes.Timestamp | null;
  /** 마감일 (선택 사항) */
  dueDate?: FirebaseFirestoreTypes.Timestamp | null; 
  /** 
   * 반복 설정 (선택 사항).
   * 이 설정이 존재하면 해당 Todo는 반복되는 항목으로 간주됩니다.
   */
  repeatSettings?: RepeatSettings;
  /** 태그 (선택 사항) */
  tags?: string[];
  /** 캘린더 이벤트 Id(구글 캘린더 연동용) (선택 사항) */
  calendarEventId?: string;
  /** 
   * 다음 발생 예정일 (타임스탬프 또는 null).
   * 반복되지 않는 일반 Todo의 경우 생성 시점 또는 마감일로 설정될 수 있습니다.
   * 반복 Todo의 경우, 이 날짜가 되어야 목록에 표시됩니다.
   * 반복이 종료되었거나, 일반 Todo가 완료되면 null이 될 수 있습니다.
   */
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null;
  // 여기에 추가적인 필드를 정의할 수 있습니다. (예: priority, tags 등)
}

/**
 * `calculateNextOccurrence` 함수에 전달되는 Todo 객체의 필수 필드를 정의하는 인터페이스입니다.
 * `Todo` 인터페이스의 부분 집합으로, 다음 반복일 계산에 필요한 최소한의 정보를 포함합니다.
 */
export interface CalculableTodoForNext {
  dueDate?: FirebaseFirestoreTypes.Timestamp | null;
  repeatSettings?: RepeatSettings;
  /** 다음 반복일 계산 로직에서 현재의 nextOccurrence 값도 참고할 수 있도록 추가 */
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null; 
  /** 계산의 기준이 되는 날짜 (예: 현재 Todo의 완료 시점 또는 특정 참조일) */
  referenceDate: FirebaseFirestoreTypes.Timestamp;
}

/**
 * `shouldShowTodo` 함수에 전달되는 Todo 객체의 필수 필드를 정의하는 인터페이스입니다.
 * `Todo` 인터페이스의 부분 집합으로, 할 일 표시 여부 결정에 필요한 최소한의 정보를 포함합니다.
 */
export interface ShowableTodo {
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null;
  // status?: TodoStatus; // 현재 shouldShowTodo는 nextOccurrence만을 기준으로 함
} 
