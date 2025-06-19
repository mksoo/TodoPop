import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

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
  /** 반복 시작일 */
  startDate: FirebaseFirestoreTypes.Timestamp;
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
  /** 성공한 날짜들 (선택 사항) */
  successDates?: FirebaseFirestoreTypes.Timestamp[];
  /** 생성일 */
  createdAt: FirebaseFirestoreTypes.Timestamp;
  /** 시작일 */
  startAt: FirebaseFirestoreTypes.Timestamp;
  /** 마감일 */
  dueAt: FirebaseFirestoreTypes.Timestamp;
  /** 
   * 반복 설정 (선택 사항).
   * 이 설정이 존재하면 해당 Todo는 반복되는 항목으로 간주됩니다.
   */
  repeatSettings?: RepeatSettings;
  /** 태그 (선택 사항) */
  tags?: string[];
  /** 캘린더 이벤트 Id(구글 캘린더 연동용) (선택 사항) */
  calendarEventId?: string;
  // 여기에 추가적인 필드를 정의할 수 있습니다. (예: priority, tags 등)
}
