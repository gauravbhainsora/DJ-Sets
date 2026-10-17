export const GENRES = [
  'Melodic House & Techno',
  'House',
  'Progressive House',
  'Dance / Pop',
] as const;

export type Genre = (typeof GENRES)[number];

export interface Recording {
  readonly id: string;
  readonly title: string;
  readonly artists: readonly string[];
  readonly version: string;
  readonly genre: Genre;
  readonly bpm: number | null;
  readonly key: string | null;
  readonly durationSeconds: number | null;
  readonly sourceUrl: string;
  readonly metadataSource: string;
  readonly verifiedOn: string | null;
  readonly energyEstimate: null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isSourceUrl(value: unknown): value is string {
  if (!isText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isRecording(value: unknown): value is Recording {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return isText(record.id)
    && isText(record.title)
    && Array.isArray(record.artists) && record.artists.length > 0 && record.artists.every(isText)
    && isText(record.version)
    && GENRES.some(genre => genre === record.genre)
    && (record.bpm === null || isPositiveNumber(record.bpm))
    && (record.key === null || isText(record.key))
    && (record.durationSeconds === null || (isPositiveNumber(record.durationSeconds) && Number.isInteger(record.durationSeconds)))
    && isSourceUrl(record.sourceUrl)
    && isText(record.metadataSource)
    && (record.verifiedOn === null || (isText(record.verifiedOn) && /^\d{4}-\d{2}-\d{2}$/.test(record.verifiedOn)))
    // Supported estimates and their evidence will be introduced together.
    && record.energyEstimate === null;
}

export async function loadCatalog(): Promise<readonly Recording[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}catalog.json`);
  if (!response.ok) throw new Error('Catalog unavailable');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isRecording)) throw new Error('Invalid starter catalog');
  if (new Set(data.map(recording => recording.id)).size !== data.length) throw new Error('Duplicate recording identity');
  return data;
}
