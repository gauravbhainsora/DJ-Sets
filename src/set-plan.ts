import type { EnergyEstimate, Genre, Recording } from './catalog';
import { phaseIndex, targetEnergy, type Phase } from './energy-arc';
import type { LibraryEntry } from './local-library';

export interface TrackPlacement {
  readonly id: string;
  readonly recordingId: Recording['id'];
  readonly playSeconds: number;
  readonly overlapSeconds: number;
  readonly locked: boolean;
  readonly pin: number | null;
  readonly annotation: string;
}

export interface PlanSettings {
  readonly genres: readonly Genre[];
  readonly targetSeconds: number;
  readonly arc: readonly Phase[];
  readonly emphasis: Readonly<Partial<Record<Genre, number>>>;
  readonly context: string;
  readonly mustInclude: readonly string[];
}

export interface SetPlan extends PlanSettings {
  readonly id: string;
  readonly energyCorrections: Readonly<Record<string, EnergyEstimate | null>>;
  readonly placements: readonly TrackPlacement[];
  readonly library: readonly LibraryEntry[];
  readonly librarySelections: Readonly<Record<string, string>>;
}

// A recording keeps its identity across plans; a placement belongs to one plan.
// This first slice uses catalog order. Musical sequencing comes in later slices.
export function createSetPlan(catalog: readonly Recording[], settings: PlanSettings, energyCorrections: SetPlan['energyCorrections'] = {}, previousPlan?: SetPlan | null): SetPlan {
  const { genres, targetSeconds, arc, context, emphasis } = settings;
  const placements: TrackPlacement[] = [];
  let total = 0;
  const required = new Set([...settings.mustInclude, ...(previousPlan?.placements.filter(placement => placement.locked || placement.pin !== null).map(placement => placement.recordingId) ?? [])]);
  const highestPin = Math.max(0, ...(previousPlan?.placements.map(placement => placement.pin ?? 0) ?? []));
  const candidates = catalog.filter(recording => genres.includes(recording.genre) || required.has(recording.id));
  const genreCounts: Partial<Record<Genre, number>> = {};
  const phaseCounts = [0, 0, 0, 0, 0];
  while (candidates.length && (total < targetSeconds || placements.length < highestPin || candidates.some(recording => required.has(recording.id)))) {
    const phase = phaseIndex(arc, total);
    const desired = targetEnergy(arc, total, phaseCounts[phase]!);
    const previousRecording = catalog.find(item => item.id === placements.at(-1)?.recordingId);
    const score = (recording: Recording): number => {
      const energy = energyCorrections[recording.id] !== undefined ? energyCorrections[recording.id] : recording.energyEstimate;
      return (energy ? Math.abs(energy.value - desired) * 6 : 40)
        - (required.has(recording.id) ? 10000 : 0)
        + (previousRecording?.bpm != null && recording.bpm != null ? Math.abs(previousRecording.bpm - recording.bpm) * .25 : 0)
        + (previousRecording?.key && recording.key && previousRecording.key !== recording.key ? .3 : 0)
        + (recording.bpm == null ? 0 : Math.abs(recording.bpm - (/warm/i.test(context) ? 118 : /headline|peak/i.test(context) ? 128 : 123)) * .12)
        + (genreCounts[recording.genre] ?? 0) / (emphasis[recording.genre] ?? 1) * 8 - Math.log(emphasis[recording.genre] ?? 1) * 2;
    };
    candidates.sort((a, b) => score(a) - score(b));
    const recording = candidates.shift()!;
    const oldPlacement = previousPlan?.placements.find(placement => placement.recordingId === recording.id);
    const playSeconds = Math.min(oldPlacement?.playSeconds ?? 240, recording.durationSeconds ?? 240);
    const previous = placements.at(-1);
    const overlapSeconds = previous ? Math.min(oldPlacement?.overlapSeconds ?? 30, Math.floor(playSeconds / 3), Math.floor(previous.playSeconds / 3)) : 0;
    placements.push({ id: oldPlacement?.id ?? crypto.randomUUID(), recordingId: recording.id, playSeconds, overlapSeconds, locked: oldPlacement?.locked ?? false, pin: oldPlacement?.pin ?? null, annotation: oldPlacement?.annotation ?? '' });
    total += playSeconds - overlapSeconds;
    phaseCounts[phase]!++;
    genreCounts[recording.genre] = (genreCounts[recording.genre] ?? 0) + 1;
  }
  return {
    id: crypto.randomUUID(),
    ...settings,
    energyCorrections,
    placements: normalizeTiming(applyPins(placements)),
    library: previousPlan?.library ?? [],
    librarySelections: previousPlan?.librarySelections ?? {},
  };
}

function applyPins(placements: readonly TrackPlacement[]): TrackPlacement[] {
  const slots: (TrackPlacement | undefined)[] = Array.from({ length: placements.length });
  const reserved = new Set<string>();
  for (const placement of placements) {
    if (placement.pin !== null && placement.pin <= slots.length && !slots[placement.pin - 1]) { slots[placement.pin - 1] = placement; reserved.add(placement.id); }
  }
  const remaining = placements.filter(placement => !reserved.has(placement.id));
  return slots.map(slot => slot ?? remaining.shift()!);
}

export function constraintNotes(plan: SetPlan, catalog: readonly Recording[]): string[] {
  const notes: string[] = [];
  for (const id of plan.mustInclude) {
    const recording = catalog.find(recording => recording.id === id);
    if (!recording) notes.push(`Unavailable required recording: ${id}. Resolve this before treating the request as satisfied.`);
    else if (!plan.placements.some(placement => placement.recordingId === id)) notes.push(`Required recording missing from the plan: ${recording.title}.`);
    else if (!plan.genres.includes(recording.genre)) notes.push(`Required ${recording.title} retained outside selected genres. Consider another phase or audition a bridge before performing.`);
  }
  const pins = new Set<number>();
  for (const [index, placement] of plan.placements.entries()) {
    const recording = catalog.find(item => item.id === placement.recordingId)!;
    if ((placement.locked || placement.pin !== null) && !plan.genres.includes(recording.genre)) notes.push(`Locked or pinned ${recording.title} retained outside selected genres. Audition an alternative phase or bridge.`);
    if (placement.pin === null) continue;
    if (pins.has(placement.pin)) notes.push(`Conflicting position pins at ${placement.pin}; both recordings remain included.`);
    pins.add(placement.pin);
    if (placement.pin !== index + 1) notes.push(`Unresolved position pin: track ${index + 1} requests position ${placement.pin}.`);
  }
  if (totalSeconds(plan) > plan.targetSeconds && (plan.mustInclude.length || plan.placements.some(placement => placement.locked || placement.pin !== null))) notes.push('Target duration exceeded while retaining required, locked, or pinned selections. Adjust play times or constraints.');
  return notes;
}

export function energyFor(plan: SetPlan, recording: Recording): EnergyEstimate | null {
  return Object.hasOwn(plan.energyCorrections, recording.id) ? plan.energyCorrections[recording.id]! : recording.energyEstimate;
}

export function guidance(plan: SetPlan, catalog: readonly Recording[], index: number): { phase: string; role: string; transition: string; target: number } {
  const elapsed = elapsedTimes(plan);
  const phase = phaseIndex(plan.arc, elapsed[index]!);
  const phaseCount = elapsed.slice(0, index).filter(time => phaseIndex(plan.arc, time) === phase).length;
  const target = targetEnergy(plan.arc, elapsed[index]!, phaseCount);
  const recording = catalog.find(item => item.id === plan.placements[index]!.recordingId)!;
  const previous = catalog.find(item => item.id === plan.placements[index - 1]?.recordingId);
  const notes: string[] = [];
  if (!previous) notes.push('Opening selection; establish the groove.');
  else {
    if (previous.genre !== recording.genre) notes.push(`Genre change: ${previous.genre} to ${recording.genre}; prepare a deliberate bridge.`);
    if (previous.bpm == null || recording.bpm == null) notes.push('BPM unknown; audition the tempo change.');
    else if (Math.abs(previous.bpm - recording.bpm) > 4) notes.push(`Direction change: ${recording.bpm - previous.bpm > 0 ? '+' : ''}${recording.bpm - previous.bpm} BPM; prepare a deliberate transition.`);
    else notes.push('Nearby tempo; audition the blend.');
    notes.push(!previous.key || !recording.key ? 'Key compatibility unknown.' : previous.key === recording.key ? 'Same reported key.' : 'Key change; check compatibility by listening.');
  }
  const estimate = energyFor(plan, recording);
  if (!estimate) notes.push('Track energy unknown; energy progression is unverified.');
  else if (Math.abs(estimate.value - target) > 1.5) notes.push('Energy compromise: consider a bridge or another placement.');
  return { phase: plan.arc[phase]!.name, role: `${plan.arc[phase]!.name}: target energy ${target.toFixed(1)}/10. For ${plan.context || 'an open performance slot'}. ${phase === 4 ? 'Return to a climax, then land intentionally.' : phase === 3 ? 'Give the audience a larger reset.' : phase === 2 && phaseCount % 3 === 2 ? 'A modest release after two intense selections.' : 'Develop this phase of the set.'}`, transition: notes.join(' '), target };
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function elapsedTimes(plan: SetPlan): number[] {
  let end = 0;
  return plan.placements.map(placement => {
    const start = end - placement.overlapSeconds;
    end = start + placement.playSeconds;
    return start;
  });
}

export function totalSeconds(plan: SetPlan): number {
  return plan.placements.reduce((total, placement) => total + placement.playSeconds - placement.overlapSeconds, 0);
}

export function timingError(plan: SetPlan, catalog: readonly Recording[]): string | null {
  for (const [index, placement] of plan.placements.entries()) {
    const recording = catalog.find(item => item.id === placement.recordingId);
    if (!Number.isInteger(placement.playSeconds) || placement.playSeconds <= 0 || (recording?.durationSeconds != null && placement.playSeconds > recording.durationSeconds)) return 'Play time must be positive whole seconds and cannot exceed the recording length.';
    const outgoing = plan.placements[index + 1]?.overlapSeconds ?? 0;
    if (!Number.isInteger(placement.overlapSeconds) || placement.overlapSeconds < 0 || (index === 0 && placement.overlapSeconds !== 0) || placement.overlapSeconds + outgoing >= placement.playSeconds) return 'Overlap must fit within adjacent play times, leaving some of each track to play.';
  }
  return null;
}

export function normalizeTiming(placements: readonly TrackPlacement[]): TrackPlacement[] {
  return placements.map((placement, index) => ({ ...placement, overlapSeconds: index === 0 ? 0 : Math.min(placement.overlapSeconds, Math.floor(placement.playSeconds / 3), Math.floor(placements[index - 1]!.playSeconds / 3)) }));
}

export function replaceTrack(plan: SetPlan, catalog: readonly Recording[], index: number, recordingId: string): SetPlan {
  const existing = plan.placements[index]!;
  if (existing.locked || existing.pin !== null || plan.mustInclude.includes(existing.recordingId)) throw new Error('Clear the inclusion lock, position pin, or must-include requirement before replacing this track.');
  const recording = catalog.find(item => item.id === recordingId);
  if (!recording || plan.placements.some(placement => placement.recordingId === recordingId)) throw new Error('No suitable replacement available; the current selection was preserved.');
  return { ...plan, placements: normalizeTiming(plan.placements.map((placement, i) => i === index ? { ...placement, recordingId, playSeconds: Math.min(placement.playSeconds, recording.durationSeconds ?? placement.playSeconds) } : placement)) };
}

export function moveTrack(plan: SetPlan, index: number, direction: number): SetPlan {
  const placements = [...plan.placements];
  const destination = index + direction;
  if (!placements[index] || !placements[destination]) return plan;
  [placements[index], placements[destination]] = [placements[destination]!, placements[index]!];
  return { ...plan, placements: normalizeTiming(placements) };
}
