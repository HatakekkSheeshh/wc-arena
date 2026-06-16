import { Activity, Award, ClipboardList, Medal, ShieldCheck, Trophy, User, Users, Wallet } from 'lucide-react';

export type NavigationItem = {
  label: string;
  shortLabel?: string;
  to: string;
  icon?: typeof Trophy;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const publicNavigation: NavigationItem[] = [
  { label: 'Matches', to: '/matches' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Rules', to: '/rules' },
  { label: 'Prize Pool', to: '/prize-pool' },
];

export const appNavigationGroups: NavigationGroup[] = [
  {
    label: 'Play',
    items: [
      { label: 'Matches', shortLabel: 'Matches', to: '/matches', icon: Trophy },
      { label: 'My Picks', shortLabel: 'Picks', to: '/picks', icon: ClipboardList },
      { label: 'My Predictions', shortLabel: 'Predicts', to: '/my-predictions', icon: Medal },
      { label: 'Leaderboard', shortLabel: 'Rank', to: '/leaderboard', icon: Award },
    ],
  },
  {
    label: 'Social',
    items: [
      { label: 'Leagues', to: '/leagues', icon: Users },
      { label: 'Activity', to: '/activity', icon: Activity },
      { label: 'Badges', to: '/badges', icon: Medal },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: '/profile', icon: User },
      { label: 'Rewards', to: '/rewards', icon: Wallet },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Control Room', to: '/admin', icon: ShieldCheck },
      { label: 'Audit Log', to: '/admin/audit', icon: ClipboardList },
    ],
  },
];

export const mobileNavigation = appNavigationGroups[0].items;
