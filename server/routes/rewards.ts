import { Router } from 'express';
import { mockEligibilityChecks, mockRewards, mockRewardTrustNotes } from '../../src/data/mockRewards';
import { readDb } from '../db/jsonDb';

export const rewardsRouter = Router();
const currentUserId = 'user-you';

rewardsRouter.get('/rewards/me', (_req, res) => {
  const db = readDb();
  const rewards = db.rewards ?? mockRewards;
  res.json({
    userId: currentUserId,
    eligibilityChecks: db.eligibilityChecks ?? mockEligibilityChecks,
    rewards: rewards.filter((reward) => reward.userId === currentUserId),
    trustNotes: db.rewardTrustNotes ?? mockRewardTrustNotes,
    payoutContactStatus: 'manual_review',
  });
});
