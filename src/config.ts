// MangaDex is the translation-lookup target (not a source provider), so its
// config stays here alongside the matcher settings.
export const mangaDex = {
  base: 'https://api.mangadex.org',
  site: 'https://mangadex.org',
  headers: {
    accept: 'application/json',
    'user-agent': 'hakkutsu/0.1 (manga discovery tool)',
  },
}

// Minimum title similarity (0..1) to treat a MangaDex hit as a real match.
export const matchThreshold = 0.45
