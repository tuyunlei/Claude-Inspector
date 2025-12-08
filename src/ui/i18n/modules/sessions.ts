import { sessionsLogs } from './sessions/logs';
import { sessionsTodos } from './sessions/todos';

export const sessions = {
  en: {
    ...sessionsLogs.en,
    ...sessionsTodos.en
  },
  zh: {
    ...sessionsLogs.zh,
    ...sessionsTodos.zh
  }
};