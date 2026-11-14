export interface ActivityItem {
  id: string;
  title: string;
  action: 'Task created' | 'Task updated';
  status: 'To Do' | 'In Progress' | 'Completed';
  assignee: string;
  timestamp: number;
}
