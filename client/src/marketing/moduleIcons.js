import { ChartColumn, Handshake, LayoutDashboard, Megaphone, Send, TrendingUp, UserSearch } from 'lucide-react';

// One icon per module, chosen for what the module does rather than a
// generic shape: find people, send posts, climb search, partner with
// creators, run ads, read the numbers.
export const MODULE_ICONS = {
  workspace: LayoutDashboard,
  leads: UserSearch,
  social: Send,
  seo: TrendingUp,
  influencer: Handshake,
  ads: Megaphone,
  reports: ChartColumn,
};
