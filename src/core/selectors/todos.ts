
import { DataStore } from '../domain/datastore';
import { TodoItem } from '../domain/todos';

export const selectTodos = (data: DataStore): TodoItem[] => {
  return data.todos;
};
