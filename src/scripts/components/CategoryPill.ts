import type { Category } from '../../types'

interface CategoryPillProps {
  category: Category | null
  selected: boolean
  onSelect: (categoryId: string | null) => void
}

export function createCategoryPill(props: CategoryPillProps): HTMLElement {
  const { category, selected, onSelect } = props

  const pill = document.createElement('button')
  const name = category?.name ?? 'Uncategorized'
  const color = category?.color ?? '#76786c'
  const icon = category?.icon ?? 'category'

  pill.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
    selected
      ? 'text-white shadow-sm'
      : 'bg-surface-container-high/50 text-on-surface/70 hover:bg-surface-container-high'
  }`

  if (selected) {
    pill.style.backgroundColor = color
  }

  const iconEl = document.createElement('span')
  iconEl.className = 'material-symbols-outlined text-sm'
  iconEl.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  iconEl.textContent = icon

  const label = document.createElement('span')
  label.textContent = name

  pill.appendChild(iconEl)
  pill.appendChild(label)

  pill.addEventListener('click', () => {
    onSelect(category?.id ?? null)
  })

  return pill
}

interface CategoryPillRowProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

export function createCategoryPillRow(props: CategoryPillRowProps): HTMLElement {
  const { categories, selectedCategoryId, onSelect } = props

  const row = document.createElement('div')
  row.className = 'flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar'
  row.id = 'category-pill-row'

  const uncategorizedPill = createCategoryPill({
    category: null,
    selected: selectedCategoryId === null,
    onSelect,
  })
  row.appendChild(uncategorizedPill)

  for (const cat of categories) {
    const pill = createCategoryPill({
      category: cat,
      selected: selectedCategoryId === cat.id,
      onSelect,
    })
    row.appendChild(pill)
  }

  return row
}

export function updateCategoryPillRow(row: HTMLElement, categories: Category[], selectedCategoryId: string | null, onSelect: (categoryId: string | null) => void): void {
  row.innerHTML = ''
  const uncategorizedPill = createCategoryPill({
    category: null,
    selected: selectedCategoryId === null,
    onSelect,
  })
  row.appendChild(uncategorizedPill)

  for (const cat of categories) {
    const pill = createCategoryPill({
      category: cat,
      selected: selectedCategoryId === cat.id,
      onSelect,
    })
    row.appendChild(pill)
  }
}