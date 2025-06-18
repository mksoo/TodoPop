import {TodoInstance} from "./todo-instances.interface";
import {Todo} from "../todos/todos.interface";
import {Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

class TodoInstancesService {
  private getCollectionRef(): admin.firestore.CollectionReference {
    return admin.firestore().collection("todoInstances");
  }

  private getRef(args: {id: string}): admin.firestore.DocumentReference {
    return this.getCollectionRef().doc(args.id);
  }

  async findBy(args: {id: string}): Promise<admin.firestore.DocumentSnapshot> {
    return this.getRef(args).get();
  }

  async create(args: {instance: Omit<TodoInstance, "id">}): Promise<void> {
    const {instance} = args;
    const ref = this.getCollectionRef();
    await ref.add(instance);
  }

  async generateTodoInstances(args: {todo: Todo}): Promise<TodoInstance[]> {
    const {todo} = args;
    const instances: TodoInstance[] = [];
    const settings = todo?.repeatSettings;

    if (!settings) {
      instances.push({
        title: todo.title,
        description: todo?.description,
        status: "ONGOING",
        templateId: todo.id,
        instanceDate: Timestamp.fromDate(todo.startAt.toDate()),
        createdAt: Timestamp.fromDate(todo.createdAt.toDate()),
        dueDate: Timestamp.fromDate(todo.dueAt.toDate()),
        tags: todo?.tags,
      });
    }

    return instances;
  }
}

export default new TodoInstancesService();
