export interface SharePayload {
  name?: string;
  studentId: string;
  completedCount: number;
  totalCount: number;
  badgeCount: number;
  completed: boolean;
  /**
   * ISO date (YYYY-MM-DD) this link/certificate was generated — the "issued
   * on" date, not a tracked completion timestamp (none is recorded anywhere
   * else). Optional, not required: links generated before this field existed
   * don't have one, and a previously-shared link must keep working forever
   * (no backend to migrate it), so consumers must handle it being absent.
   */
  date?: string;
}
