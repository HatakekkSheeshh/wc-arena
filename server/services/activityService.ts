import type { ActivityItem } from '../../src/types/domain';
import type { PredictDb } from '../types';

export function addActivity(db: PredictDb, item: Omit<ActivityItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
  const createdAt = item.createdAt ?? new Date().toISOString();
  const id = item.id ?? `activity-${item.type}-${createdAt}`;
  const activityItem: ActivityItem = { ...item, id, createdAt };
  db.activity.unshift(activityItem);
  return activityItem;
}

export function markActivityRead(db: PredictDb, activityId: string) {
  const item = db.activity.find((activity) => activity.id === activityId);
  return item;
}
