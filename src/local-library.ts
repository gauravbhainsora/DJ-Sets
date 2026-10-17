import type { Recording } from './catalog';

export interface LibraryEntry {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly version: string | null;
  readonly location: string;
}

export function localFilePath(location: string): string {
  const url = new URL(location);
  if (url.protocol !== 'file:' || !['', 'localhost'].includes(url.hostname) || url.search || url.hash) throw new Error('Only local file references are supported.');
  const path = decodeURIComponent(url.pathname);
  if (!path.startsWith('/') || /[\r\n\0]/.test(path)) throw new Error('Invalid local file reference.');
  return /^\/[A-Za-z]:\//.test(path) ? path.slice(1) : path;
}

export function isLibraryEntry(value: unknown): value is LibraryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (!['id', 'title', 'artist', 'location'].every(key => typeof entry[key] === 'string' && String(entry[key]).trim()) || !(entry.version === null || typeof entry.version === 'string')) return false;
  try { localFilePath(entry.location as string); return true; } catch { return false; }
}

export function parseLibrary(text: string): LibraryEntry[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Invalid Rekordbox XML: document type and entity declarations are not supported.');
  const document = new DOMParser().parseFromString(text, 'application/xml');
  const collection = document.querySelector('DJ_PLAYLISTS > COLLECTION');
  if (document.querySelector('parsererror') || document.documentElement.tagName !== 'DJ_PLAYLISTS' || !collection) throw new Error('Invalid Rekordbox XML: expected DJ_PLAYLISTS and COLLECTION.');
  const tracks = [...collection.children];
  const entries = tracks.map((track): LibraryEntry => {
    if (track.tagName !== 'TRACK') throw new Error('Invalid Rekordbox XML: unsupported collection element.');
    let title = track.getAttribute('Name')?.trim() ?? '';
    const mix = track.getAttribute('Mix')?.trim() || null;
    const suffix = title.match(/\s*\(([^()]*(?:mix|edit|version|freddit)[^()]*)\)\s*$/i);
    const version = mix || suffix?.[1]?.trim() || null;
    if (suffix && (!mix || normalized(mix) === normalized(suffix[1]!))) title = title.slice(0, suffix.index).trim();
    const entry = { id: track.getAttribute('TrackID') ?? '', title, artist: track.getAttribute('Artist')?.trim() ?? '', version, location: track.getAttribute('Location') ?? '' };
    if (!isLibraryEntry(entry)) throw new Error('Invalid Rekordbox XML: each track needs identity and a valid local file Location.');
    return entry;
  });
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('Invalid Rekordbox XML: duplicate TrackID.');
  return entries;
}

const normalized = (value: string): string => value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');

export interface LibraryMatch {
  readonly status: 'Matched' | 'Unmatched' | 'Ambiguous';
  readonly candidates: readonly LibraryEntry[];
  readonly entry: LibraryEntry | null;
}

export function matchRecording(recording: Recording, library: readonly LibraryEntry[], selectedId?: string): LibraryMatch {
  const candidates = library.filter(entry => entry.version !== null
    && normalized(entry.title) === normalized(recording.title)
    && normalized(entry.artist) === normalized(recording.artists.join(', '))
    && normalized(entry.version) === normalized(recording.version));
  const selected = selectedId ? candidates.find(entry => entry.id === selectedId) : null;
  const entry = selected ?? (candidates.length === 1 ? candidates[0]! : null);
  return { status: entry ? 'Matched' : candidates.length ? 'Ambiguous' : 'Unmatched', candidates, entry };
}
