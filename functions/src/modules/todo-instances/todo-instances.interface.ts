import {DocumentSnapshot, Timestamp} from "firebase-admin/firestore";

export interface TodoInstance {
  id?: string;
  title: string;
  description?: string;
  status: "ONGOING" | "COMPLETED" | "FAILED";
  templateId: string;
  instanceDate?: Timestamp;
  dueDate?: Timestamp;
  tags?: string[];
  createdAt: Timestamp;
}

/**
 * Firestore 문서를 TodoInstance 객체로 변환하는 함수입니다.
 * @param {DocumentSnapshot} doc - Firestore 문서
 * @return {TodoInstance} TodoInstance 객체
 */
export function docToTodoInstance(doc: DocumentSnapshot): TodoInstance {
  const data = doc.data();
  if (!data) {
    throw new Error("TodoInstance data is undefined");
  }
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    status: data.status,
    templateId: data.templateId,
    instanceDate: data.instanceDate,
    dueDate: data.dueDate,
    tags: data.tags,
    createdAt: data.createdAt,
  };
}
