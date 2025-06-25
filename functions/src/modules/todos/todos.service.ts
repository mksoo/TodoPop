import dayjs = require("dayjs");
import * as admin from "firebase-admin";

/**
 * TodosService 클래스는 Todos 컬렉션에 대한 Firestore 참조를 제공합니다.
 */
class TodosService {
  /**
   * Todos 컬렉션의 경로를 반환합니다.
   * @return {string} Todos 컬렉션의 경로
   */
  protected getCollectionPath(): string {
    return "Todos";
  }

  /**
   * Todos 컬렉션의 Firestore 참조를 반환합니다.
   * @return {admin.firestore.CollectionReference} Todos 컬렉션의 Firestore 참조
   */
  getCollectionRef(): admin.firestore.CollectionReference {
    return admin.firestore().collection(this.getCollectionPath());
  }

  /**
   * 특정 Todo의 Firestore 참조를 반환합니다.
   * @param {{id: string}} args
   * @return {admin.firestore.DocumentReference} Todo의 Firestore 참조
   */
  getRef(args: {
    id: string;
  }): admin.firestore.DocumentReference {
    return this.getCollectionRef().doc(args.id);
  }

  /**
   * 특정 Todo의 데이터를 조회합니다.
   * @param {{id: string}} args
   * @return {Promise<admin.firestore.DocumentSnapshot>} Todo의 데이터
   */
  async findBy(args: {id: string}): Promise<admin.firestore.DocumentSnapshot> {
    const {id} = args;
    const doc = await this.getRef({id}).get();

    if (!doc.exists) {
      throw new Error(`Todo with id ${id} not found`);
    }

    return doc;
  }

  /**
   * 마감일이 지난 Todo를 조회합니다.
   * @param {{limit: number, lastDoc: admin.firestore.DocumentSnapshot}} args
   * @return {Promise<admin.firestore.DocumentSnapshot[]>} 마감일이 지난 Todo
   */
  async getOverdueTodosByCursor(args: {
    limit: number,
    lastDoc: admin.firestore.DocumentSnapshot | null,
  }): Promise<admin.firestore.DocumentSnapshot[]> {
    const {limit, lastDoc} = args;
    const now = dayjs().toDate();
    const todosRef = this.getCollectionRef();
    const query = todosRef
      .where("dueDate", "<=", now)
      .where("status", "==", "ONGOING")
      .limit(limit);

    if (lastDoc) {
      query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    return snapshot.docs;
  }
}

export default new TodosService();
