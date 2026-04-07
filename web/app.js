const API_BASE = 'http://localhost:8000'

// Fallback-data hvis API ikke svarer
const FALLBACK = {
  categories: [
    { id: 'Referanse',      menu: 'Referanse og DNS',         target_count: 6  },
    { id: 'Gaming_Steam',   menu: 'Steam og Valve',           target_count: 6  },
    { id: 'Streaming',      menu: 'Internasjonal Streaming',  target_count: 10 },
    { id: 'Norsk_TV',       menu: 'Norsk TV',                 target_count: 10 },
    { id: 'Sosiale_Medier', menu: 'Sosiale Medier',           target_count: 10 },
  ],
  targets: [
    { title: 'Cloudflare DNS',    host: '1.1.1.1',                                    category: 'Referanse',      category_menu: 'Referanse og DNS'        },
    { title: 'Google DNS',        host: '8.8.8.8',                                    category: 'Referanse',      category_menu: 'Referanse og DNS'        },
    { title: 'Steam Stockholm',   host: 'sto1.valve.net',                             category: 'Gaming_Steam',   category_menu: 'Steam og Valve'          },
    { title: 'Netflix Oslo CDN',  host: 'ipv4-c001-osl001-ix.1.oca.nflxvideo.net',   category: 'Streaming',      category_menu: 'Internasjonal Streaming' },
    { title: 'Spotify',           host: 'dealer.spotify.com',                        category: 'Streaming',      category_menu: 'Internasjonal Streaming' },
    { title: 'Discord',           host: 'discord.com',                               category: 'Sosiale_Medier', category_menu: 'Sosiale Medier'          },
  ],
}

// ── State ────────────────────────────────────────────────────────────
let allTargets    = []
let allCategories = []
let activeCategory = 'all'
let searchQuery    = ''

// ── Boot ─────────────────────────────────────────────────────────────
async function init () {
  await loadData()
  renderTabs()
  renderTargets()
  bindSearch()
  bindIntTabs()
  bindCopyButtons()
  bindTableRows()
}

// ── Data loading ──────────────────────────────────────────────────────
async function loadData () {
  try {
    const [catRes, tgtRes] = await Promise.all([
      fetch(`${API_BASE}/api/categories`),
      fetch(`${API_BASE}/api/targets?limit=1000`),
    ])
    if (!catRes.ok || !tgtRes.ok) throw new Error('API error')
    const catJson = await catRes.json()
    const tgtJson = await tgtRes.json()
    allCategories = catJson.categories
    allTargets    = tgtJson.targets
  } catch {
    // API is down — use fallback data
    allCategories = FALLBACK.categories
    allTargets    = FALLBACK.targets
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────
function renderTabs () {
  const container = document.getElementById('category-tabs')
  container.innerHTML = ''

  const all = makeTab('all', 'Alle', activeCategory === 'all')
  container.appendChild(all)

  for (const cat of allCategories) {
    const btn = makeTab(cat.id, `${cat.menu} (${cat.target_count})`, activeCategory === cat.id)
    container.appendChild(btn)
  }
}

function makeTab (id, label, active) {
  const btn = document.createElement('button')
  btn.className = 'tab-btn' + (active ? ' active' : '')
  btn.textContent = label
  btn.addEventListener('click', () => {
    activeCategory = id
    renderTabs()
    renderTargets()
  })
  return btn
}

// ── Targets ───────────────────────────────────────────────────────────
function renderTargets () {
  const grid  = document.getElementById('targets-grid')
  const empty = document.getElementById('targets-empty')
  grid.innerHTML = ''

  let list = allTargets

  if (activeCategory !== 'all') {
    list = list.filter(t => t.category === activeCategory)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    list = list.filter(t =>
      t.host.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      (t.category_menu || '').toLowerCase().includes(q)
    )
  }

  if (list.length === 0) {
    empty.style.display = 'block'
    grid.style.display  = 'none'
    return
  }

  empty.style.display = 'none'
  grid.style.display  = 'grid'

  for (const t of list) {
    const card = document.createElement('div')
    card.className = 'target-card'
    card.innerHTML = `
      <div class="target-name" title="${esc(t.title)}">${esc(t.title)}</div>
      <div class="target-host" title="${esc(t.host)}">${esc(t.host)}</div>
    `
    grid.appendChild(card)
  }
}

// ── Search ────────────────────────────────────────────────────────────
function bindSearch () {
  const input = document.getElementById('search-input')
  let debounce
  input.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      searchQuery = input.value.trim()
      renderTargets()
    }, 180)
  })
}

// ── Integration tabs ──────────────────────────────────────────────────
function bindIntTabs () {
  const tabs   = document.querySelectorAll('.int-tab')
  const panels = document.querySelectorAll('.int-panel')

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      panels.forEach(p => p.classList.remove('active'))
      tab.classList.add('active')
      const target = document.getElementById('tab-' + tab.dataset.tab)
      if (target) target.classList.add('active')
    })
  })
}

// ── Copy buttons ──────────────────────────────────────────────────────
function bindCopyButtons () {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pre = document.getElementById(btn.dataset.target)
      if (!pre) return
      const text = pre.innerText || pre.textContent
      await copyText(text)
      btn.textContent = 'Kopiert!'
      btn.classList.add('copied')
      setTimeout(() => {
        btn.textContent = 'Kopier'
        btn.classList.remove('copied')
      }, 2000)
    })
  })
}

// ── Clickable table rows ──────────────────────────────────────────────
function bindTableRows () {
  document.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', async () => {
      const url = row.dataset.url
      if (!url) return
      await copyText(url)
      showToast(`Kopiert: ${url}`)
    })
  })
}

// ── Helpers ───────────────────────────────────────────────────────────
async function copyText (text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity  = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function showToast (msg) {
  const toast = document.getElementById('copy-toast')
  toast.textContent = msg
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

function esc (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Start ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init)
