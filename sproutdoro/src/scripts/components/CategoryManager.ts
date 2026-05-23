import type { Category } from '../../types'
import { saveCategory, deleteCategory } from '../storage'

interface CategoryManagerProps {
  categories: Category[]
  onCategoryChange: () => void
}

const CATEGORY_COLORS = ['#516233', '#934a29', '#fd9e77', '#3f5d87', '#5876a1', '#76786c', '#c4553d', '#7b6b8d', '#4a8c6f', '#d4a843']
const CATEGORY_ICONS = ['psychology', 'menu_book', 'event_note', 'palette', 'school', 'code', 'fitness_center', 'music_note', 'science', 'work']

export function createCategoryManager(props: CategoryManagerProps): HTMLElement {
  const { categories, onCategoryChange } = props

  const container = document.createElement('div')
  container.id = 'category-manager'
  container.className = 'space-y-3'

  for (const cat of categories) {
    const row = document.createElement('div')
    row.className = 'flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-all duration-200'

    const colorDot = document.createElement('span')
    colorDot.className = 'w-4 h-4 rounded-full flex-shrink-0'
    colorDot.style.backgroundColor = cat.color

    const icon = document.createElement('span')
    icon.className = 'material-symbols-outlined text-lg'
    icon.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
    icon.style.color = cat.color
    icon.textContent = cat.icon

    const name = document.createElement('span')
    name.className = 'font-body text-sm text-on-surface flex-1'
    name.textContent = cat.name

    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-on-surface/40 hover:text-error hover:bg-error/10 transition-all duration-200'
    deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">close</span>'
    deleteBtn.title = `Delete ${cat.name}`
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Delete "${cat.name}" category?`)) {
        await deleteCategory(cat.id)
        onCategoryChange()
      }
    })

    row.appendChild(colorDot)
    row.appendChild(icon)
    row.appendChild(name)
    row.appendChild(deleteBtn)
    container.appendChild(row)
  }

  const addBtn = document.createElement('button')
  addBtn.className = 'w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface/50 hover:text-primary hover:border-primary/50 transition-all duration-200'
  addBtn.innerHTML = '<span class="material-symbols-outlined text-lg" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">add</span><span class="font-label text-sm font-semibold">Add Category</span>'
  addBtn.addEventListener('click', () => {
    showAddCategoryModal(onCategoryChange)
  })

  container.appendChild(addBtn)
  return container
}

function showAddCategoryModal(onCategoryChange: () => void): void {
  const existingModal = document.getElementById('add-category-modal')
  if (existingModal) existingModal.remove()

  const overlay = document.createElement('div')
  overlay.id = 'add-category-modal'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-6 max-w-md w-full mx-4 flex flex-col gap-4'

  const title = document.createElement('h3')
  title.className = 'font-headline text-lg font-bold text-on-surface'
  title.textContent = 'Add Category'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.placeholder = 'Category name'
  nameInput.className = 'w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body text-sm border border-outline-variant/20 focus:border-primary focus:outline-none transition-all duration-200'

  const colorLabel = document.createElement('span')
  colorLabel.className = 'font-label text-xs text-on-surface/50 uppercase tracking-wider'
  colorLabel.textContent = 'Color'

  const colorRow = document.createElement('div')
  colorRow.className = 'flex flex-wrap gap-2'
  let selectedColor = CATEGORY_COLORS[0]
  for (const color of CATEGORY_COLORS) {
    const swatch = document.createElement('button')
    swatch.className = 'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110'
    swatch.style.backgroundColor = color
    if (color === selectedColor) {
      swatch.style.outline = '2px solid #1c1c16'
      swatch.style.outlineOffset = '2px'
    }
    swatch.addEventListener('click', () => {
      selectedColor = color
      colorRow.querySelectorAll('button').forEach((b) => {
        b.style.outline = 'none'
        b.style.outlineOffset = '0'
      })
      swatch.style.outline = '2px solid #1c1c16'
      swatch.style.outlineOffset = '2px'
    })
    colorRow.appendChild(swatch)
  }

  const iconLabel = document.createElement('span')
  iconLabel.className = 'font-label text-xs text-on-surface/50 uppercase tracking-wider'
  iconLabel.textContent = 'Icon'

  const iconRow = document.createElement('div')
  iconRow.className = 'flex flex-wrap gap-2'
  let selectedIcon = CATEGORY_ICONS[0]
  for (const ic of CATEGORY_ICONS) {
    const iconBtn = document.createElement('button')
    iconBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-all duration-200'
    if (ic === selectedIcon) {
      iconBtn.classList.add('ring-2', 'ring-primary', 'bg-primary/5')
    }
    iconBtn.innerHTML = `<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${ic === selectedIcon ? '1' : '0'}, 'wght' 400;">${ic}</span>`
    iconBtn.addEventListener('click', () => {
      selectedIcon = ic
      iconRow.querySelectorAll('button').forEach((b) => {
        b.classList.remove('ring-2', 'ring-primary', 'bg-primary/5')
        b.querySelector('span')!.style.fontVariationSettings = "'FILL' 0, 'wght' 400"
      })
      iconBtn.classList.add('ring-2', 'ring-primary', 'bg-primary/5')
      iconBtn.querySelector('span')!.style.fontVariationSettings = "'FILL' 1, 'wght' 400"
    })
    iconRow.appendChild(iconBtn)
  }

  const btnRow = document.createElement('div')
  btnRow.className = 'flex items-center gap-3 justify-end'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'px-4 py-2 rounded-xl font-label text-sm font-semibold text-on-surface/60 hover:text-on-surface transition-all duration-200'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', () => overlay.remove())

  const createBtn = document.createElement('button')
  createBtn.className = 'px-6 py-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
  createBtn.textContent = 'Create'
  createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim()
    if (!name) return
    const category: Category = {
      id: `cat-${crypto.randomUUID()}`,
      name,
      color: selectedColor,
      icon: selectedIcon,
      createdAt: Date.now(),
    }
    await saveCategory(category)
    overlay.remove()
    onCategoryChange()
  })

  btnRow.appendChild(cancelBtn)
  btnRow.appendChild(createBtn)

  card.appendChild(title)
  card.appendChild(nameInput)
  card.appendChild(colorLabel)
  card.appendChild(colorRow)
  card.appendChild(iconLabel)
  card.appendChild(iconRow)
  card.appendChild(btnRow)
  overlay.appendChild(card)

  document.body.appendChild(overlay)
}