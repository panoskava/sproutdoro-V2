export interface NavItem {
  icon: string
  label: string
  href: string
}

export const NAV_ITEMS: NavItem[] = [
  { icon: 'timer', label: 'Focus', href: './index.html' },
  { icon: 'potted_plant', label: 'Garden', href: './garden.html' },
  { icon: 'bar_chart', label: 'Insights', href: './insights.html' },
  { icon: 'settings', label: 'Config', href: './settings.html' },
]
