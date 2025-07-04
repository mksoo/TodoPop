import * as admin from "firebase-admin"
import { docToUser } from "./users.interface";

class Users {
  private getCollectionRef() {
    return admin.firestore().collection("Users");
  }

  getRef(args: {id: string}) {
    const {id} = args;
    return this.getCollectionRef().doc(id);
  }

  async findBy(args: {id: string}) {
    const {id} = args;
    const doc = await this.getRef({id}).get();

    if (!doc.exists) {
      throw new Error(`User with id: ${id} not found`);
    }

    return docToUser(doc);
  }
}

export default new Users();