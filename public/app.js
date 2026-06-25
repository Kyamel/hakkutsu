const el = (id) => document.getElementById(id)

const state = {
  providers: [],
  provider: 'comicwalker',
  providerInfo: null,
  groups: [],
  feed: null, // active feed key, e.g. 'new'
  filter: null, // { group, param, id, slug } — selected browse item or feed filter
  sortBy: 'new',
  limit: 10,
  offset: 0,
  total: 0, // number, or null when the provider exposes no count (cursor-style pager)
  count: 0, // items in the current page
  hasPrevious: false,
  hasNext: false,
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
  state.groups = taxonomy.groups
  state.sortBy = firstSortValue()
  el('library').value = state.provider
  renderGroups()
}

// First sort offered by any group; renderSortOptions corrects it per selection.
function firstSortValue() {
  for (const group of state.groups) {
    if (group.sorts[0]) return group.sorts[0].value
  }
  return 'new'
}

// One fieldset per group: feed groups render a toggle (+ optional filter chips),
// browse groups render their items as chips.
function renderGroups() {
  el('picker').innerHTML = state.groups.map(groupHtml).join('')
}

function groupHtml(group) {
  return group.mode === 'feed' ? feedGroupHtml(group) : browseGroupHtml(group)
}

function feedGroupHtml(group) {
  const toggle = `<button class="chip" data-feed="${escapeHtml(group.key)}">
      <span class="chip-label">${escapeHtml(group.label)}</span>
    </button>`
  const filters = group.items.map((item) => itemChipHtml(group, item)).join('')
  return `<fieldset><legend>Browse</legend><div class="chips">${toggle}${filters}</div></fieldset>`
}

function browseGroupHtml(group) {
  if (!group.items.length) return ''
  const chips = group.items.map((item) => itemChipHtml(group, item)).join('')
  return `<fieldset><legend>${escapeHtml(group.label)}</legend><div class="chips">${chips}</div></fieldset>`
}

function itemChipHtml(group, item) {
  return `<button class="chip" data-group="${escapeHtml(group.key)}" data-param="${escapeHtml(group.param)}" data-id="${escapeHtml(item.id)}" data-slug="${escapeHtml(item.slug)}">
      <span class="chip-label">${escapeHtml(item.label)}</span>
      <span class="chip-name">${escapeHtml(item.name)}</span>
    </button>`
}

function activeGroup() {
  const key = state.feed ?? state.filter?.group
  return key ? state.groups.find((group) => group.key === key) : null
}

// Sorts of the active group that declare they apply to that dimension.
function applicableSorts() {
  const group = activeGroup()
  if (!group) return []
  return group.sorts.filter((sort) => sort.appliesTo.includes(group.key))
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
  el('sort').disabled = sorts.length <= 1
}

function selectChip(chip) {
  if ('feed' in chip.dataset) {
    const feed = chip.dataset.feed
    const wasOn = state.feed === feed && !state.filter
    resetSelection()
    if (!wasOn) state.feed = feed
    onSelectionChanged()
    return
  }

  const { group, param, id, slug } = chip.dataset
  const groupDef = state.groups.find((g) => g.key === group)
  const same = state.filter && state.filter.group === group && state.filter.id === id
  resetSelection()
  if (!same) {
    state.filter = { group, param, id, slug }
    if (groupDef?.mode === 'feed') state.feed = group
  }
  onSelectionChanged()
}

function onSelectionChanged() {
  applySelectionClasses()
  renderSortOptions()
}

function applySelectionClasses() {
  document.querySelectorAll('.chip.selected').forEach((c) => c.classList.remove('selected'))
  if (state.feed) {
    document.querySelector(`.chip[data-feed="${CSS.escape(state.feed)}"]`)?.classList.add('selected')
  }
  if (state.filter) {
    document
      .querySelector(
        `.chip[data-group="${CSS.escape(state.filter.group)}"][data-slug="${CSS.escape(state.filter.slug)}"]`,
      )
      ?.classList.add('selected')
  }
}

function worksUrl() {
  const query = new URLSearchParams({
    provider: state.provider,
    limit: String(state.limit),
    offset: String(state.offset),
  })
  if (state.feed) query.set('feed', state.feed)
  if (state.filter) query.set(state.filter.param, state.filter.id)
  if (state.sortBy && applicableSorts().length) query.set('sortBy', state.sortBy)
  return `/api/works?${query}`
}

async function loadWorks(preserveScroll = false) {
  const scrollY = window.scrollY
  const results = el('results')
  const previousHeight = results.offsetHeight
  if (preserveScroll && previousHeight) results.style.minHeight = `${previousHeight}px`

  if (state.providerInfo.capabilities.requiresFilter && !state.feed && !state.filter) {
    state.total = 0
    state.count = 0
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
    state.count = page.results.length
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
  if (!works.length) {
    results.innerHTML = '<p class="muted">No works.</p>'
    return
  }
  results.innerHTML = ''
  for (const work of works) {
    const ratio = work.thumbnailAspectRatio || 16 / 9
    const freeCount =
      work.freeEpisodeCount != null
        ? `<div class="free-count">▶ ${work.freeEpisodeCount} free</div>`
        : ''
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `
      <img src="${work.thumbnail}" alt="" loading="lazy" style="aspect-ratio:${ratio}" />
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
  const nav = el('pager')
  const current = Math.floor(state.offset / state.limit) + 1

  // Unknown total (cursor-style provider): show the range without a total and a
  // Prev · Page N · Next control driven by hasPrevious/hasNext.
  if (state.total == null) {
    el('pageInfo').textContent = state.count ? `${state.offset + 1}–${state.offset + state.count}` : '—'
    if (!state.hasPrevious && !state.hasNext) {
      nav.innerHTML = ''
      return
    }
    nav.innerHTML = [
      pageButton('‹', current - 1, { disabled: !state.hasPrevious }),
      `<span class="page-gap">Page ${current}</span>`,
      pageButton('›', current + 1, { disabled: !state.hasNext }),
    ].join('')
    return
  }

  const from = state.total ? state.offset + 1 : 0
  const to = Math.min(state.offset + state.limit, state.total)
  el('pageInfo').textContent = state.total ? `${from}–${to} of ${state.total}` : '—'

  const totalPages = Math.ceil(state.total / state.limit)
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
  if (state.filter) {
    params.set(state.filter.param === 'tagId' ? 'tag' : 'genre', state.filter.slug)
  }
  if (state.sortBy && applicableSorts().length) params.set('sort', state.sortBy)

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

  const genreChip = findItemChip('genreId', params.get('genre'))
  const tagChip = findItemChip('tagId', params.get('tag'))
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
  state.filter = null
}

function validOption(selectId, value) {
  return [...el(selectId).options].some((option) => option.value === String(value))
}

function findItemChip(param, slug) {
  if (!slug) return null
  return document.querySelector(`.chip[data-param="${CSS.escape(param)}"][data-slug="${CSS.escape(slug)}"]`)
}

// Default selection for a provider: its New feed when available, otherwise the
// first chip (e.g. the "All" category on ComicWalker Free).
function selectDefaultChip() {
  const chip = state.providerInfo.capabilities.new
    ? document.querySelector('.chip[data-feed]')
    : el('picker').querySelector('.chip')
  if (chip) selectChip(chip)
}

async function changeProvider(providerId, replaceUrl = false) {
  resetSelection()
  state.provider = providerId
  state.offset = 0
  await loadTaxonomy(providerId)
  selectDefaultChip()
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
  if (!location.search) {
    selectDefaultChip()
    writeUrl(true)
  }
  loadWorks()
}

init()
