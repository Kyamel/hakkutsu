const el = (id) => document.getElementById(id)

const state = {
  library: 'all', // 'all' (genres/tags/new) or 'free' (free-campaign feed)
  source: 'tag', // within 'all': 'tag' (genre/tag browse) or 'new' (recent releases)
  genreId: null,
  genreSlug: null,
  tagId: null,
  tagSlug: null,
  freeType: null, // within 'free': a category type, or null for all free titles
  sortBy: 'new',
  limit: 10,
  offset: 0,
  total: 0,
}

async function getJson(url) {
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? res.statusText)
  return body
}

async function loadTags() {
  const all = await getJson('/api/tags')
  renderChips('genres', all.filter((t) => t.type === 'genre'))
  renderChips('tags', all.filter((t) => t.type === 'tag'))
}

function renderChips(containerId, items) {
  el(containerId).innerHTML = items
    .map(
      (t) => `<button class="chip" data-id="${t.id}" data-type="${t.type}" data-slug="${t.slug}">
        <span class="chip-label">${t.label}</span>
        <span class="chip-name">${t.name}</span>
      </button>`,
    )
    .join('')
}

async function loadFreeCategories() {
  const cats = await getJson('/api/free/categories')
  const all = `<button class="chip" data-free="">
      <span class="chip-label">All free</span>
      <span class="chip-name">すべて</span>
    </button>`
  el('free-cats').innerHTML =
    all +
    cats
      .map(
        (c) => `<button class="chip" data-free="${c.type}">
        <span class="chip-label">${c.label}</span>
        <span class="chip-name">${c.name}</span>
      </button>`,
      )
      .join('')
}

// Free and New are exclusive. Genre/tag browse allows one genre and one tag;
// clicking a selected browse chip deselects it.
function selectChip(chip) {
  if ('free' in chip.dataset) {
    document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
    chip.classList.add('selected')
    state.library = 'free'
    state.freeType = chip.dataset.free || null
  } else {
    state.library = 'all'
    if (chip.dataset.source === 'new') {
      document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
      chip.classList.add('selected')
      state.source = 'new'
      state.genreId = null
      state.genreSlug = null
      state.tagId = null
      state.tagSlug = null
    } else {
      document.querySelector('.chip[data-source="new"]')?.classList.remove('selected')
      state.source = 'tag'
      const type = chip.dataset.type
      const wasSelected = chip.classList.contains('selected')
      document.querySelectorAll(`.chip[data-type="${CSS.escape(type)}"].selected`).forEach((c) => {
        c.classList.remove('selected')
      })

      if (wasSelected) {
        if (type === 'genre') {
          state.genreId = null
          state.genreSlug = null
        } else {
          state.tagId = null
          state.tagSlug = null
        }
      } else {
        chip.classList.add('selected')
        if (type === 'genre') {
          state.genreId = chip.dataset.id
          state.genreSlug = chip.dataset.slug
        } else {
          state.tagId = chip.dataset.id
          state.tagSlug = chip.dataset.slug
        }
      }
    }
  }
  el('library').value = state.library
  togglePickers()
  // Free and New feeds have a fixed order, so sort does not apply.
  el('sort').disabled = state.library === 'free' || state.source === 'new'
}

function togglePickers() {
  el('picker-all').hidden = state.library === 'free'
  el('picker-free').hidden = state.library !== 'free'
}

function worksUrl() {
  const page = { limit: String(state.limit), offset: String(state.offset) }
  if (state.library === 'free') {
    const query = new URLSearchParams({ ...page, free: '1' })
    if (state.freeType) query.set('tag', state.freeType)
    return `/api/works?${query}`
  }
  if (state.source === 'new') {
    return `/api/new?${new URLSearchParams(page)}`
  }
  const query = new URLSearchParams({ ...page, sortBy: state.sortBy })
  if (state.genreId) query.set('genreId', state.genreId)
  if (state.tagId) query.set('tagId', state.tagId)
  return `/api/works?${query}`
}

async function loadWorks() {
  const results = el('results')
  if (state.library === 'all' && state.source === 'tag' && !state.genreId && !state.tagId) {
    state.total = 0
    results.classList.remove('free')
    results.innerHTML = '<p class="muted">Select a genre, a tag, or both.</p>'
    renderPager()
    return
  }
  results.innerHTML = '<p class="muted">Loading…</p>'
  try {
    const page = await getJson(worksUrl())
    state.total = page.total
    state.hasPrevious = page.hasPrevious
    state.hasNext = page.hasNext
    renderWorks(page.results)
    renderPager()
  } catch (err) {
    results.innerHTML = `<p class="muted">Failed: ${err.message}</p>`
  }
}

function renderWorks(works) {
  const results = el('results')
  results.classList.toggle('free', state.library === 'free')
  if (!works.length) {
    results.innerHTML = '<p class="muted">No works.</p>'
    return
  }
  results.innerHTML = ''
  for (const work of works) {
    const freeCount =
      work.freeEpisodeCount != null
        ? `<div class="free-count">▶ ${work.freeEpisodeCount} free</div>`
        : ''
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `
      <img src="${work.thumbnail}" alt="" loading="lazy" />
      <div class="meta">
        <div class="title">${escapeHtml(work.title)}</div>
        ${freeCount}
        <a class="source" href="${work.url}" target="_blank" rel="noopener" title="${work.url}">${work.url}</a>
      </div>`
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return
      selectWork(card, work)
    })
    results.appendChild(card)
  }
}

function renderPager() {
  const from = state.total ? state.offset + 1 : 0
  const to = Math.min(state.offset + state.limit, state.total)
  el('pageInfo').textContent = state.total ? `${from}–${to} of ${state.total}` : '—'

  const totalPages = Math.ceil(state.total / state.limit)
  const current = Math.floor(state.offset / state.limit) + 1
  const nav = el('pager')
  if (totalPages <= 1) {
    nav.innerHTML = ''
    return
  }

  const parts = [
    //pageButton('«', 1, { disabled: current === 1 }),
    pageButton('‹', current - 1, { disabled: current === 1 }),
  ]
  for (const item of pageItems(current, totalPages)) {
    parts.push(item === '…' ? '<span class="page-gap">…</span>' : pageButton(item, item, { current: item === current }))
  }
  parts.push(pageButton('›', current + 1, { disabled: current === totalPages }))
  //parts.push(pageButton('»', totalPages, { disabled: current === totalPages }))
  nav.innerHTML = parts.join('')
}

function pageButton(label, page, opts = {}) {
  const attrs = [`data-page="${page}"`]
  if (opts.disabled) attrs.push('disabled')
  const cls = opts.current ? 'page page-current' : 'page'
  return `<button class="${cls}" ${attrs.join(' ')}>${label}</button>`
}

// First page, last page, and a window around the current page, with "…" filling
// the gaps. The window slides near the edges so the button count stays roughly
// constant (≈7 numbers) instead of collapsing on the first/last pages.
function pageItems(current, total) {
  const siblings = 2 // pages shown each side of current
  const slots = siblings * 2 + 5 // first + last + 2 gaps + current ± siblings
  if (total <= slots) return range(1, total)

  const start = Math.max(Math.min(current - siblings, total - siblings * 2 - 2), 2)
  const end = Math.min(Math.max(current + siblings, siblings * 2 + 3), total - 1)

  return [
    1,
    start > 2 ? '…' : 2,
    ...range(Math.max(start, 3), Math.min(end, total - 2)),
    end < total - 1 ? '…' : total - 1,
    total,
  ]
}

function range(start, end) {
  return start > end ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

async function selectWork(card, work) {
  document.querySelectorAll('.card.selected').forEach((c) => c.classList.remove('selected'))
  card.classList.add('selected')

  const panel = el('match')
  panel.innerHTML = `<p class="muted">Searching MangaDex for “${escapeHtml(work.title)}”…</p>`
  try {
    const result = await getJson(`/api/match?title=${encodeURIComponent(work.title)}`)
    panel.innerHTML = renderMatch(work, result)
  } catch (err) {
    panel.innerHTML = `<p class="muted">Match failed: ${err.message}</p>`
  }
}

function renderMatch(work, result) {
  if (!result.matched) {
    return `<h2>${escapeHtml(work.title)}</h2>
      <p class="muted">No confident match on MangaDex.</p>`
  }
  const m = result.manga
  const langs = m.languages.length
    ? `<ul class="langs">${m.languages.map(renderLang).join('')}</ul>`
    : '<p class="muted">Matched, but no translated chapters yet.</p>'
  const description = m.description
    ? `<p class="description">${escapeHtml(m.description)}</p>`
    : ''
  return `
    <h2>${escapeHtml(work.title)}</h2>
    <p>
      <a href="${m.url}" target="_blank" rel="noopener">${escapeHtml(m.title)}</a>
      <span class="muted"> · confidence ${m.confidence}</span>
    </p>
    ${langs}
    ${description}`
}

function renderLang(lang) {
  const date = lang.latestChapterAt ? new Date(lang.latestChapterAt).toISOString().slice(0, 10) : '—'
  const cls = lang.language === 'en' ? 'lang-en' : ''
  return `<li class="${cls}">
    <span class="lang-code">${lang.language}</span>
    <span>${lang.chapterCount} ch</span>
    <span class="muted">last ${date}</span>
  </li>`
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function currentPage() {
  return Math.floor(state.offset / state.limit) + 1
}

// The URL is the shareable source of truth. Free uses ?free=1[&tag=<category>];
// otherwise the readable ?tag=<slug> form ("new" for the recent-releases feed),
// with ?tagId=<uuid> still accepted on read. Sort applies only to genre/tag.
function writeUrl(replace = false) {
  const params = new URLSearchParams({ page: String(currentPage()), limit: String(state.limit) })
  if (state.library === 'free') {
    params.set('free', '1')
    if (state.freeType) params.set('tag', state.freeType)
  } else if (state.source === 'new') {
    params.set('tag', 'new')
  } else {
    if (state.genreSlug) params.set('genre', state.genreSlug)
    if (state.tagSlug) params.set('tag', state.tagSlug)
    params.set('sort', state.sortBy)
  }
  const url = `?${params}`
  if (replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
}

function readUrl() {
  const params = new URLSearchParams(location.search)
  resetSelection()
  if (params.get('free')) {
    selectChip(findFreeChip(params.get('tag')))
  } else if (params.get('tag') === 'new') {
    const chip = document.querySelector('.chip[data-source="new"]')
    if (!chip) return false
    selectChip(chip)
  } else {
    const genreChip = findTypedChip('genre', params.get('genreId'), params.get('genre'))
    const legacyChip = !genreChip ? findChip(params.get('tagId'), params.get('tag')) : null
    const tagChip = findTypedChip('tag', params.get('tagId'), params.get('tag'))
    if (!genreChip && !legacyChip && !tagChip) return false
    if (genreChip) selectChip(genreChip)
    if (legacyChip) selectChip(legacyChip)
    if (tagChip && tagChip !== legacyChip) selectChip(tagChip)
  }

  const limit = Number(params.get('limit'))
  if (validOption('limit', limit)) {
    state.limit = limit
    el('limit').value = String(limit)
  }
  const sort = params.get('sort')
  if (validOption('sort', sort)) {
    state.sortBy = sort
    el('sort').value = sort
  }

  state.offset = (Math.max(1, Number(params.get('page')) || 1) - 1) * state.limit
  return true
}

function resetSelection() {
  document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
  state.library = 'all'
  state.source = 'tag'
  state.genreId = null
  state.genreSlug = null
  state.tagId = null
  state.tagSlug = null
  state.freeType = null
}

// Accept a URL value only if it matches one of the control's own options.
function validOption(selectId, value) {
  return [...el(selectId).options].some((o) => o.value === String(value))
}

// Locate a chip by exact id (tagId), or by slug / the "new" sentinel (tag).
function findChip(tagId, tag) {
  if (tagId) return document.querySelector(`.chip[data-id="${CSS.escape(tagId)}"]`)
  if (tag === 'new') return document.querySelector('.chip[data-source="new"]')
  if (tag) return document.querySelector(`.chip[data-slug="${CSS.escape(tag)}"]`)
  return null
}

function findTypedChip(type, id, slug) {
  if (id) return document.querySelector(`.chip[data-type="${CSS.escape(type)}"][data-id="${CSS.escape(id)}"]`)
  if (slug) return document.querySelector(`.chip[data-type="${CSS.escape(type)}"][data-slug="${CSS.escape(slug)}"]`)
  return null
}

// A free category chip, falling back to the "All free" chip for unknown/absent.
function findFreeChip(type) {
  return (
    (type && document.querySelector(`.chip[data-free="${CSS.escape(type)}"]`)) ||
    document.querySelector('.chip[data-free=""]')
  )
}

// Selecting a tag (or changing a control) searches immediately — no button.
function search() {
  state.offset = 0
  writeUrl()
  loadWorks()
}

for (const picker of document.querySelectorAll('.picker')) {
  picker.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip')
    if (!chip) return
    selectChip(chip)
    search()
  })
}

el('library').addEventListener('change', () => {
  const picker = el('library').value === 'free' ? el('picker-free') : el('picker-all')
  selectChip(picker.querySelector('.chip'))
  search()
})

el('sort').addEventListener('change', () => {
  state.sortBy = el('sort').value
  search()
})

el('limit').addEventListener('change', () => {
  state.limit = Number(el('limit').value)
  search()
})

el('pager').addEventListener('click', (e) => {
  const btn = e.target.closest('button.page')
  if (!btn || btn.disabled || btn.classList.contains('page-current')) return
  state.offset = (Number(btn.dataset.page) - 1) * state.limit
  writeUrl()
  loadWorks()
})

window.addEventListener('popstate', () => {
  if (readUrl()) loadWorks()
})

async function init() {
  await Promise.all([loadTags(), loadFreeCategories()])
  if (!readUrl()) {
    // Bare root: fall back to the default view (New releases) and normalize the
    // URL so it is never an empty page.
    selectChip(document.querySelector('.chip'))
    writeUrl(true)
  }
  loadWorks()
}

init()
