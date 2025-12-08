
export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: string;
  id?: string;
  sessionId?: string;
}
