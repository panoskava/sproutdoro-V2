interface SoundCardProps {
  icon: string
  name: string
  description: string
  selected: boolean
  accentColor?: string
  onSelect: () => void
}

export function createSoundCard(props: SoundCardProps): HTMLElement {
  const { icon, name, description, selected, accentColor = '#516233', onSelect } = props

  const card = document.createElement('button')
  card.type = 'button'
  card.className =
    'flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-center sound-card'

  if (selected) {
    card.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary')
  } else {
    card.classList.add(
      'border-outline-variant/50',
      'bg-white/40',
      'hover:bg-white/60',
      'hover:-translate-y-0.5'
    )
  }

  const iconWrap = document.createElement('div')
  iconWrap.className = 'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
  iconWrap.style.backgroundColor = `${accentColor}15`

  const iconEl = document.createElement('span')
  iconEl.className = 'material-symbols-outlined text-xl'
  iconEl.style.color = accentColor
  iconEl.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  iconEl.textContent = icon

  iconWrap.appendChild(iconEl)

  const textWrap = document.createElement('div')
  textWrap.className = 'flex flex-col gap-1'

  const nameEl = document.createElement('span')
  nameEl.className = 'font-label text-sm font-semibold text-on-surface'
  nameEl.textContent = name

  const descEl = document.createElement('span')
  descEl.className = 'text-xs text-on-surface/60'
  descEl.textContent = description

  textWrap.appendChild(nameEl)
  textWrap.appendChild(descEl)

  card.appendChild(iconWrap)
  card.appendChild(textWrap)

  card.addEventListener('click', onSelect)

  return card
}
