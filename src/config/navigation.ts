import { Activity, Award, ClipboardList, Medal, ShieldCheck, Trophy, User, Users, Wallet } from 'lucide-react';

export type NavigationItem = {
  labelKey: string;
  shortLabelKey?: string;
  to: string;
  icon?: typeof Trophy;
};

export type NavigationGroup = {
  labelKey: string;
  items: NavigationItem[];
};

export const publicNavigation: NavigationItem[] = [
  { labelKey: 'nav.public.matches', to: '/matches' },
  { labelKey: 'nav.public.leaderboard', to: '/leaderboard' },
  { labelKey: 'nav.public.rules', to: '/rules' },
  { labelKey: 'nav.public.prizePool', to: '/prize-pool' },
];

export const appNavigationGroups: NavigationGroup[] = [
  {
    labelKey: 'nav.groups.play',
    items: [
      { labelKey: 'nav.items.matches', shortLabelKey: 'nav.items.matches', to: '/matches', icon: Trophy },
      { labelKey: 'nav.items.myPicks', shortLabelKey: 'nav.items.picks', to: '/picks', icon: ClipboardList },
      { labelKey: 'nav.items.myPredictions', shortLabelKey: 'nav.items.predicts', to: '/my-predictions', icon: Medal },
      { labelKey: 'nav.items.leaderboard', shortLabelKey: 'nav.items.rank', to: '/leaderboard', icon: Award },
    ],
  },
  {
    labelKey: 'nav.groups.social',
    items: [
      { labelKey: 'nav.items.leagues', to: '/leagues', icon: Users },
      { labelKey: 'nav.items.activity', to: '/activity', icon: Activity },
      { labelKey: 'nav.items.badges', to: '/badges', icon: Medal },
    ],
  },
  {
    labelKey: 'nav.groups.account',
    items: [
      { labelKey: 'nav.items.profile', to: '/profile', icon: User },
      { labelKey: 'nav.items.rewards', to: '/rewards', icon: Wallet },
    ],
  },
  {
    labelKey: 'nav.groups.admin',
    items: [
      { labelKey: 'nav.items.controlRoom', to: '/admin', icon: ShieldCheck },
      { labelKey: 'nav.items.auditLog', to: '/admin/audit', icon: ClipboardList },
    ],
  },
];

export const mobileNavigation = appNavigationGroups[0].items;
