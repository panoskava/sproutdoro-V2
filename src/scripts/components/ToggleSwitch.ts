interface ToggleSwitchProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function createToggleSwitch(props: ToggleSwitchProps): HTMLElement {
  const { label, description, checked, onChange } = props

  const container = document.createElement('div')
  container.className = 'flex items-center justify-between gap-4'

  const textWrap = document.createElement('div')
  textWrap.className = 'flex flex-col gap-0.5'

  const labelEl = document.createElement('span')
  labelEl.className = 'font-label text-sm font-semibold text-on-surface'
  labelEl.textContent = label

  const descEl = document.createElement('span')
  descEl.className = 'text-xs text-on-surface/60'
  descEl.textContent = description

  textWrap.appendChild(labelEl)
  textWrap.appendChild(descEl)

  const switchWrap = document.createElement('label')
  switchWrap.className = 'relative inline-flex items-center cursor-pointer flex-shrink-0'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = 'sr-only peer'
  checkbox.checked = checked
  checkbox.setAttribute('role', 'switch')
  checkbox.setAttribute('aria-checked', String(checked))
  checkbox.setAttribute('aria-label', label)

  const track = document.createElement('div')
  track.className = `w-11 h-6 rounded-full peer transition-colors duration-200 ${
    checked ? 'bg-primary' : 'bg-surface-container-high'
  }`

  const thumb = document.createElement('div')
  thumb.className = `absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
    checked ? 'translate-x-5' : 'translate-x-0'
  }`

  checkbox.addEventListener('change', () => {
    const isChecked = checkbox.checked
    checkbox.setAttribute('aria-checked', String(isChecked))
    track.className = `w-11 h-6 rounded-full peer transition-colors duration-200 ${
      isChecked ? 'bg-primary' : 'bg-surface-container-high'
    }`
    thumb.className = `absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
      isChecked ? 'translate-x-5' : 'translate-x-0'
    }`
    onChange(isChecked)
  })

  switchWrap.appendChild(checkbox)
  switchWrap.appendChild(track)
  switchWrap.appendChild(thumb)

  container.appendChild(textWrap)
  container.appendChild(switchWrap)

  return container
}
