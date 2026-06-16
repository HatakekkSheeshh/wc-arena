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
    description: 'You have enough submitted picks to qualify for ranked sponsor rewards.',
    status: 'passed',
    href: '/my-predictions',
  },
  {
    id: 'eligibility-rules-accepted',
    label: 'Public rules acknowledged',
    description: 'Review scoring, tie-breakers, and prize eligibility before rewards are approved.',
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
    label: 'Winner contact ready',
    description: 'Reward contact details are collected manually after approval. No wallet balance is stored in this MVP.',
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
    currency: 'USD',
    source: 'sponsor',
    status: 'pending',
    updatedAt: '2026-06-15T22:00:00Z',
    note: 'Keep predicting to climb into the sponsor reward tiers.',
  },
  {
    id: 'reward-community-thanks',
    userId: currentUserId,
    title: 'Community challenge eligibility',
    period: 'Opening Round',
    placement: 'Qualified participant',
    amount: 0,
    currency: 'USD',
    source: 'community',
    status: 'approved',
    updatedAt: '2026-06-14T18:30:00Z',
    note: 'Eligible for non-cash community recognition and sponsor partner perks.',
  },
  {
    id: 'reward-grand-prize-track',
    userId: currentUserId,
    title: 'Overall leaderboard prize track',
    period: 'Full Tournament',
    placement: 'Outside paid tier',
    amount: 0,
    currency: 'USD',
    source: 'sponsor',
    status: 'ineligible',
    updatedAt: '2026-06-13T20:00:00Z',
    note: 'Reach the published leaderboard tiers to enter manual reward review.',
  },
];

export const mockRewardTrustNotes: RewardTrustNote[] = [
  {
    id: 'trust-free-entry',
    title: 'Free to enter',
    description: 'Predictions are skill-contest entries. Players do not pay an entry fee to qualify.',
  },
  {
    id: 'trust-sponsored-pool',
    title: 'Sponsor and community backed',
    description: 'Reward pools are funded by sponsors and optional community support, not by winner-takes-loser stakes.',
  },
  {
    id: 'trust-public-scoring',
    title: 'Public scoring rules',
    description: 'Scoring, lock deadlines, and tie-breakers are visible before matches are played.',
  },
  {
    id: 'trust-manual-review',
    title: 'Manual winner review',
    description: 'Potential winners are reviewed for eligibility and contacted manually before any payout is processed.',
  },
];
