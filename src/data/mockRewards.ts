import type { EligibilityCheck, RewardItem, RewardTrustNote } from '../types/domain';
import { currentUserId } from './mockUsers';

export const mockEligibilityChecks: EligibilityCheck[] = [
  {
    id: 'eligibility-account-verified',
    label: 'Account verified',
    description: 'Your contest profile has a verified email and stable player identity.',
    status: 'passed',
    href: '/profile',
  },
  {
    id: 'eligibility-minimum-picks',
    label: 'Minimum predictions reached',
    description: 'You have enough submitted picks to appear in ranked recognition tiers.',
    status: 'passed',
    href: '/my-predictions',
  },
  {
    id: 'eligibility-rules-accepted',
    label: 'Public rules acknowledged',
    description: 'Review scoring, tie-breakers, and fair-play rules before recognition is approved.',
    status: 'review',
    href: '/rules',
  },
  {
    id: 'eligibility-integrity-clear',
    label: 'Integrity review clear',
    description: 'No duplicate-account or late-pick flags are attached to this profile.',
    status: 'passed',
  },
  {
    id: 'eligibility-contact-ready',
    label: 'Recognition profile ready',
    description: 'Recognition details are reviewed manually after approval. Points stay virtual inside this game.',
    status: 'review',
    href: '/profile',
  },
];

export const mockRewards: RewardItem[] = [
  {
    id: 'reward-week-1-you',
    userId: currentUserId,
    title: 'Week 1 exact-score ladder',
    period: 'Group Stage Week 1',
    placement: '#124 global',
    amount: 0,
    currency: 'PTS',
    source: 'community',
    status: 'pending',
    updatedAt: '2026-06-15T22:00:00Z',
    note: 'Keep predicting to climb into the community recognition tiers.',
  },
  {
    id: 'reward-community-thanks',
    userId: currentUserId,
    title: 'Community challenge eligibility',
    period: 'Opening Round',
    placement: 'Qualified participant',
    amount: 0,
    currency: 'PTS',
    source: 'community',
    status: 'approved',
    updatedAt: '2026-06-14T18:30:00Z',
    note: 'Eligible for community recognition, badges, and bragging rights.',
  },
  {
    id: 'reward-grand-prize-track',
    userId: currentUserId,
    title: 'Overall leaderboard recognition track',
    period: 'Full Tournament',
    placement: 'Outside top tier',
    amount: 0,
    currency: 'PTS',
    source: 'community',
    status: 'ineligible',
    updatedAt: '2026-06-13T20:00:00Z',
    note: 'Reach the published leaderboard tiers to enter fair-play recognition review.'
  },
];

export const mockRewardTrustNotes: RewardTrustNote[] = [
  {
    id: 'trust-free-entry',
    title: 'Free to enter',
    description: 'Predict 2026 is free to play. Points are virtual and cannot be exchanged.'
  },
  {
    id: 'trust-virtual-points',
    title: 'Virtual points only',
    description: 'Points, badges, and ranks are for fun community recognition only.',
  },
  {
    id: 'trust-public-scoring',
    title: 'Public scoring rules',
    description: 'Scoring, lock deadlines, and tie-breakers are visible before matches are played.',
  },
  {
    id: 'trust-manual-review',
    title: 'Manual fair-play review',
    description: 'Top players are reviewed for eligibility before public recognition is published.',
  },
];
