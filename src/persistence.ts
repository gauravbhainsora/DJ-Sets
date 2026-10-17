import { GENRES, isEnergyEstimate, isRecording, type Recording } from './catalog';
import { arcError, defaultArc } from './energy-arc';
import { timingError, type SetPlan } from './set-plan';
import { isLibraryEntry, matchRecording } from './local-library';

export interface PlanBundle {
  readonly version: 1;
  readonly name: string;
  readonly catalog: readonly Recording[];
  readonly plan: SetPlan;
}

const STORAGE_KEY = 'dj-sets.saved-plans.v1';
export const MAX_BACKUP_BYTES = 50_000_000;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.length <= 20000;

export function validateBundle(value: unknown): PlanBundle {
  if (!isObject(value) || value.version !== 1) throw new Error('Unsupported backup version. Existing work was preserved.');
  if (!isText(value.name) || !value.name.trim() || !Array.isArray(value.catalog) || !value.catalog.every(isRecording) || new Set(value.catalog.map(item => item.id)).size !== value.catalog.length || !isObject(value.plan)) throw new Error('Invalid backup catalog or plan. Existing work was preserved.');
  const raw = value.plan;
  const snapshotCatalog = value.catalog;
  if (!isText(raw.id) || !raw.id || !Array.isArray(raw.genres) || !raw.genres.length || !raw.genres.every(genre => GENRES.includes(genre)) || new Set(raw.genres).size !== raw.genres.length
    || typeof raw.targetSeconds !== 'number' || !Number.isInteger(raw.targetSeconds) || raw.targetSeconds < 60 || raw.targetSeconds > 86400
    || !isText(raw.context) || !Array.isArray(raw.mustInclude) || !raw.mustInclude.every(isText)
    || !Array.isArray(raw.arc) || raw.arc.length !== 5 || !raw.arc.every((phase, index) => isObject(phase) && phase.name === defaultArc(7200)[index]!.name && typeof phase.endSeconds === 'number' && typeof phase.startEnergy === 'number' && typeof phase.endEnergy === 'number')
    || !isObject(raw.emphasis) || !Object.entries(raw.emphasis).every(([genre, weight]) => GENRES.some(item => item === genre) && typeof weight === 'number' && Number.isFinite(weight) && weight >= 1 && weight <= 10)
    || !isObject(raw.energyCorrections) || !Object.entries(raw.energyCorrections).every(([id, estimate]) => snapshotCatalog.some(recording => recording.id === id) && (estimate === null || isEnergyEstimate(estimate)))
    || !Array.isArray(raw.placements) || !raw.placements.every(placement => isObject(placement) && isText(placement.id) && placement.id && isText(placement.recordingId) && snapshotCatalog.some(recording => recording.id === placement.recordingId) && typeof placement.playSeconds === 'number' && typeof placement.overlapSeconds === 'number' && typeof placement.locked === 'boolean' && (placement.pin === null || (typeof placement.pin === 'number' && Number.isInteger(placement.pin) && placement.pin >= 1 && placement.pin <= 10000)) && isText(placement.annotation))) throw new Error('Invalid backup settings or recording references. Existing work was preserved.');
  const bundle = value as unknown as PlanBundle;
  if (!Array.isArray(raw.library) || !raw.library.every(isLibraryEntry) || new Set(raw.library.map(entry => entry.id)).size !== raw.library.length || !isObject(raw.librarySelections) || !Object.entries(raw.librarySelections).every(([recordingId, libraryId]) => {
    const recording = bundle.catalog.find(item => item.id === recordingId);
    return !!recording && typeof libraryId === 'string' && matchRecording(recording, bundle.plan.library, libraryId).candidates.some(entry => entry.id === libraryId);
  })) throw new Error('Invalid backup local library or match selections. Existing work was preserved.');
  if (new Set(bundle.plan.placements.map(item => item.id)).size !== bundle.plan.placements.length || new Set(bundle.plan.placements.map(item => item.recordingId)).size !== bundle.plan.placements.length || arcError(bundle.plan.arc, bundle.plan.targetSeconds) || timingError(bundle.plan, bundle.catalog)) throw new Error('Invalid backup constraints or timing. Existing work was preserved.');
  return bundle;
}

export function readSavedPlans(): PlanBundle[] {
  const text = localStorage.getItem(STORAGE_KEY);
  if (!text) return [];
  const value: unknown = JSON.parse(text);
  if (!Array.isArray(value)) throw new Error('Saved plans could not be read. Back up your current plan before repairing browser storage.');
  return value.map(validateBundle);
}

export function savePlan(bundle: PlanBundle): void {
  validateBundle(bundle);
  const saved = readSavedPlans();
  const remaining = saved.filter(item => item.plan.id !== bundle.plan.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...remaining, bundle]));
}

export function downloadFile(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
