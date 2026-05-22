interface StatCardProps {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string
  delay?: number
  dataStat?: string
}

export function createStatCard(props: StatCardProps): HTMLElement {
  const { icon, iconBg, iconColor, label, value, delay = 0, dataStat } = props

  const card = document.createElement('div')
  if (dataStat) {
    card.dataset.stat = dataStat
  }
  card.className =
    'stat-card-glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 cursor-default'
  if (delay > 0) {
    card.style.animationDelay = `${delay}ms`
  }

  const iconWrap = document.createElement('div')
  iconWrap.className =
    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
  iconWrap.style.backgroundColor = iconBg

  const iconEl = document.createElement('span')
  iconEl.className = 'material-symbols-outlined text-xl'
  iconEl.style.color = iconColor
  iconEl.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  iconEl.textContent = icon
  iconWrap.appendChild(iconEl)

  const textWrap = document.createElement('div')
  textWrap.className = 'flex flex-col'

  const labelEl = document.createElement('span')
  labelEl.className =
    'font-label text-[10px] uppercase tracking-wider text-on-surface/50 font-semibold'
  labelEl.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'font-headline text-xl font-bold text-on-surface'
  valueEl.textContent = value

  textWrap.appendChild(labelEl)
  textWrap.appendChild(valueEl)

  card.appendChild(iconWrap)
  card.appendChild(textWrap)

  return card
}
