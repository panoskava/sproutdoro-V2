interface RangeSliderProps {
  label: string
  min: number
  max: number
  value: number
  unit?: string
  accentColor?: string
  onChange: (value: number) => void
}

export function createRangeSlider(props: RangeSliderProps): HTMLElement {
  const { label, min, max, value, unit = '', accentColor = '#516233', onChange } = props

  const container = document.createElement('div')
  container.className = 'flex flex-col gap-2'

  const header = document.createElement('div')
  header.className = 'flex items-center justify-between'

  const sliderId = `rs-${Math.random().toString(36).slice(2, 9)}`

  const labelEl = document.createElement('label')
  labelEl.className = 'font-label text-sm font-semibold text-on-surface'
  labelEl.textContent = label
  labelEl.setAttribute('for', sliderId)

  const valueEl = document.createElement('span')
  valueEl.className = 'font-label text-sm text-on-surface/70 tabular-nums'
  valueEl.textContent = `${value}${unit}`

  header.appendChild(labelEl)
  header.appendChild(valueEl)

  const inputWrap = document.createElement('div')
  inputWrap.className = 'relative w-full'

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.value = String(value)
  input.className = 'w-full h-2 rounded-full appearance-none cursor-pointer'
  input.id = sliderId

  function getGradientPercent(val: number): number {
    if (max <= min) return 50
    return ((val - min) / (max - min)) * 100
  }

  function updateBackground(val: number) {
    const percent = getGradientPercent(val)
    input.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percent}%, #ece8de ${percent}%, #ece8de 100%)`
  }

  updateBackground(value)

  const style = document.createElement('style')
  style.textContent = `
    #${sliderId} {
      -webkit-appearance: none;
      appearance: none;
      outline: none;
    }
    #${sliderId}::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${accentColor};
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      margin-top: -6px;
    }
    #${sliderId}::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 9999px;
    }
    #${sliderId}::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${accentColor};
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    #${sliderId}::-moz-range-track {
      height: 4px;
      border-radius: 9999px;
      background: transparent;
    }
  `

  input.addEventListener('input', () => {
    const newValue = Number(input.value)
    valueEl.textContent = `${newValue}${unit}`
    updateBackground(newValue)
    onChange(newValue)
  })

  inputWrap.appendChild(input)
  container.appendChild(header)
  container.appendChild(inputWrap)
  container.appendChild(style)

  return container
}
