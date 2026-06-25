import type { RecognitionTier } from '../types/domain';

export const mockPointsGuideSummary = {
  totalAmount: 0,
  communityBackedAmount: 0,
  currency: 'PTS',
  eligiblePlayers: 0,
};

export const mockRecognitionTiers: RecognitionTier[] = [
  { id: 'tier-1', label: 'Top Legend', amount: 0, rankStart: 1, rankEnd: 1, communityBacked: false },
  { id: 'tier-2', label: 'Runner-Up Kudos', amount: 0, rankStart: 2, rankEnd: 2, communityBacked: false },
  { id: 'tier-3', label: 'Third Place Kudos', amount: 0, rankStart: 3, rankEnd: 3, communityBacked: false },
  { id: 'tier-4-10', label: 'Top 10 Recognition', amount: 0, rankStart: 4, rankEnd: 10, communityBacked: false },
  { id: 'tier-11-100', label: 'Top 100 Recognition', amount: 0, rankStart: 11, rankEnd: 100, communityBacked: false },
  { id: 'tier-101-1000', label: 'Top 1000 Recognition', amount: 0, rankStart: 101, rankEnd: 1000, communityBacked: false },
];
