const el = (id) => document.getElementById(id)

const state = {
  providers: [],
  provider: 'comicwalker',
  providerInfo: null,
  taxonomy: { genres: [], tags: [], sorts: [] },
  feed: null,
  genreId: null,
  genreSlug: null,
  tagId: null,
  tagSlug: null,
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

async function loadProviders() {
  state.providers = await getJson('/api/providers')
  el('library').innerHTML = state.providers
    .map((provider) => `<option value="${provider.id}">${escapeHtml(provider.name)}</option>`)
    .join('')
}

async function loadTaxonomy(providerId) {
  const taxonomy = await getJson(`/api/taxonomy?provider=${encodeURIComponent(providerId)}`)
  state.provider = taxonomy.provider.id
  state.providerInfo = taxonomy.provider
  state.taxonomy = taxonomy
  state.sortBy = taxonomy.sorts[0]?.value ?? 'new'
  el('library').value = state.provider
  renderTaxonomy()
}

function renderTaxonomy() {
  renderBrowse()
  renderChips('genres', state.taxonomy.genres)
  renderChips('tags', state.taxonomy.tags)
  renderSortOptions()

  el('browse-fieldset').hidden = !state.providerInfo.capabilities.new
  el('genre-fieldset').hidden = state.taxonomy.genres.length === 0
  el('tag-fieldset').hidden = state.taxonomy.tags.length === 0
}

function renderBrowse() {
  el('browse').innerHTML = state.providerInfo.capabilities.new
    ? `<button class="chip" data-feed="new">
        <span class="chip-label">New releases</span>
        <span class="chip-name">最新更新</span>
      </button>`
    : ''
}

function renderChips(containerId, items) {
  el(containerId).innerHTML = items
    .map(
      (item) => `<button class="chip" data-id="${item.id}" data-type="${item.type}" data-slug="${item.slug}">
        <span class="chip-label">${escapeHtml(item.label)}</span>
        <span class="chip-name">${escapeHtml(item.name)}</span>
      </button>`,
    )
    .join('')
}

// Sorts whose scope list matches the current genre/tag selection.
function applicableSorts() {
  return state.taxonomy.sorts.filter(
    (sort) =>
      (state.genreId && sort.appliesTo.includes('genre')) ||
      (state.tagId && sort.appliesTo.includes('tag')),
  )
}

function renderSortOptions() {
  const sorts = applicableSorts()
  if (!sorts.some((sort) => sort.value === state.sortBy)) {
    state.sortBy = sorts[0]?.value ?? state.sortBy
  }
  el('sort').innerHTML = sorts
    .map((sort) => `<option value="${sort.value}">${escapeHtml(sort.label)}</option>`)
    .join('')
  el('sort').value = state.sortBy
  updateSortState(sorts)
}

function updateSortState(sorts = applicableSorts()) {
  el('sort').disabled = Boolean(state.feed) || sorts.length <= 1
}

function selectChip(chip) {
  if ('feed' in chip.dataset) {
    document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
    chip.classList.add('selected')
    state.feed = chip.dataset.feed
    state.genreId = null
    state.genreSlug = null
    state.tagId = null
    state.tagSlug = null
    renderSortOptions()
    return
  }

  state.feed = null
  document.querySelector('.chip[data-feed].selected')?.classList.remove('selected')
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
  renderSortOptions()
}

function worksUrl() {
  const query = new URLSearchParams({
    provider: state.provider,
    limit: String(state.limit),
    offset: String(state.offset),
  })
  if (state.feed) query.set('feed', state.feed)
  if (state.genreId) query.set('genreId', state.genreId)
  if (state.tagId) query.set('tagId', state.tagId)
  if (!state.feed && state.sortBy) query.set('sortBy', state.sortBy)
  return `/api/works?${query}`
}

async function loadWorks(preserveScroll = false) {
  const scrollY = window.scrollY
  const results = el('results')
  const previousHeight = results.offsetHeight
  if (preserveScroll && previousHeight) results.style.minHeight = `${previousHeight}px`

  if (state.providerInfo.capabilities.requiresFilter && !state.feed && !state.genreId && !state.tagId) {
    state.total = 0
    results.classList.remove('free')
    results.innerHTML = '<p class="muted">Select a genre, a tag, or a browse option.</p>'
    renderPager()
    restoreScroll(preserveScroll, scrollY)
    releaseResultsHeight(preserveScroll)
    return
  }

  results.innerHTML = '<p class="muted">Loading…</p>'
  restoreScroll(preserveScroll, scrollY)
  try {
    const page = await getJson(worksUrl())
    state.total = page.total
    state.hasPrevious = page.hasPrevious
    state.hasNext = page.hasNext
    renderWorks(page.results)
    renderPager()
    restoreScroll(preserveScroll, scrollY)
  } catch (err) {
    results.innerHTML = `<p class="muted">Failed: ${err.message}</p>`
    restoreScroll(preserveScroll, scrollY)
  } finally {
    releaseResultsHeight(preserveScroll)
  }
}

function restoreScroll(shouldRestore, scrollY) {
  if (shouldRestore) window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' })
}

function releaseResultsHeight(shouldRelease) {
  if (!shouldRelease) return
  requestAnimationFrame(() => {
    el('results').style.minHeight = ''
  })
}

function renderWorks(works) {
  const results = el('results')
  // Free-campaign results carry freeEpisodeCount and use portrait cover art.
  results.classList.toggle('free', works.some((work) => work.freeEpisodeCount != null))
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

  const parts = [pageButton('‹', current - 1, { disabled: current === 1 })]
  for (const item of pageItems(current, totalPages)) {
    parts.push(item === '…' ? '<span class="page-gap">…</span>' : pageButton(item, item, { current: item === current }))
  }
  parts.push(pageButton('›', current + 1, { disabled: current === totalPages }))
  nav.innerHTML = parts.join('')
}

function pageButton(label, page, opts = {}) {
  const attrs = [`data-page="${page}"`]
  if (opts.disabled) attrs.push('disabled')
  const cls = opts.current ? 'page page-current' : 'page'
  return `<button class="${cls}" ${attrs.join(' ')}>${label}</button>`
}

function pageItems(current, total) {
  const siblings = 2
  const slots = siblings * 2 + 5
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
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function currentPage() {
  return Math.floor(state.offset / state.limit) + 1
}

function writeUrl(replace = false) {
  const params = new URLSearchParams({
    provider: state.provider,
    page: String(currentPage()),
    limit: String(state.limit),
  })
  if (state.feed) params.set('feed', state.feed)
  if (state.genreSlug) params.set('genre', state.genreSlug)
  if (state.tagSlug) params.set('tag', state.tagSlug)
  if (!state.feed && state.sortBy) params.set('sort', state.sortBy)

  const url = `?${params}`
  if (replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
}

function readUrl() {
  const params = new URLSearchParams(location.search)
  resetSelection()
  state.provider = params.get('provider') || state.provider

  const feed = params.get('feed')
  if (feed) {
    const chip = document.querySelector(`.chip[data-feed="${CSS.escape(feed)}"]`)
    if (chip) selectChip(chip)
  }

  const genreChip = findTypedChip('genre', params.get('genre'))
  const tagChip = findTypedChip('tag', params.get('tag'))
  if (genreChip) selectChip(genreChip)
  if (tagChip) selectChip(tagChip)

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
}

function resetSelection() {
  document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
  state.feed = null
  state.genreId = null
  state.genreSlug = null
  state.tagId = null
  state.tagSlug = null
}

function validOption(selectId, value) {
  return [...el(selectId).options].some((option) => option.value === String(value))
}

function findTypedChip(type, slug) {
  if (!slug) return null
  return document.querySelector(`.chip[data-type="${CSS.escape(type)}"][data-slug="${CSS.escape(slug)}"]`)
}

async function changeProvider(providerId, replaceUrl = false) {
  resetSelection()
  state.provider = providerId
  state.offset = 0
  await loadTaxonomy(providerId)
  if (state.providerInfo.capabilities.new) {
    const newChip = document.querySelector('.chip[data-feed="new"]')
    if (newChip) selectChip(newChip)
  }
  writeUrl(replaceUrl)
  await loadWorks(true)
}

function search() {
  state.offset = 0
  writeUrl()
  loadWorks(true)
}

el('picker').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip')
  if (!chip) return
  selectChip(chip)
  search()
})

el('library').addEventListener('change', () => {
  changeProvider(el('library').value)
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
  loadWorks(true)
})

window.addEventListener('popstate', async () => {
  const params = new URLSearchParams(location.search)
  const provider = params.get('provider') || state.providers[0]?.id || 'comicwalker'
  await loadTaxonomy(provider)
  readUrl()
  loadWorks()
})

async function init() {
  await loadProviders()
  const params = new URLSearchParams(location.search)
  const provider = params.get('provider') || state.providers[0]?.id || 'comicwalker'
  await loadTaxonomy(provider)
  readUrl()
  if (!location.search && state.providerInfo.capabilities.new) {
    const newChip = document.querySelector('.chip[data-feed="new"]')
    if (newChip) selectChip(newChip)
    writeUrl(true)
  }
  loadWorks()
}

init()
