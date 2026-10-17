export interface Phase {
  readonly name: string;
  readonly endSeconds: number;
  readonly startEnergy: number;
  readonly endEnergy: number;
}

export function defaultArc(duration: number): Phase[] {
  return [
    { name: 'Anchor', endSeconds: duration / 8, startEnergy: 6, endEnergy: 6 },
    { name: 'Build', endSeconds: duration * 3 / 8, startEnergy: 6, endEnergy: 8 },
    { name: 'Peak', endSeconds: duration * 5 / 8, startEnergy: 9, endEnergy: 10 },
    { name: 'Breather', endSeconds: duration * 17 / 24, startEnergy: 6.5, endEnergy: 6.5 },
    { name: 'Second climax and landing', endSeconds: duration, startEnergy: 9.5, endEnergy: 5.5 },
  ];
}

export function arcError(arc: readonly Phase[], duration: number): string | null {
  if (arc.length !== 5) return 'An energy arc needs five phases.';
  let start = 0;
  for (const phase of arc) {
    if (!Number.isFinite(phase.endSeconds) || phase.endSeconds <= start || phase.endSeconds > duration || ![phase.startEnergy, phase.endEnergy].every(value => Number.isFinite(value) && value >= 1 && value <= 10)) return 'Phase boundaries must increase without gaps, and target energy must be between 1 and 10.';
    start = phase.endSeconds;
  }
  return Math.abs(start - duration) < .01 ? null : 'The landing must end at the target duration.';
}

export function phaseIndex(arc: readonly Phase[], seconds: number): number {
  const index = arc.findIndex(phase => seconds < phase.endSeconds);
  return index < 0 ? arc.length - 1 : index;
}

export function targetEnergy(arc: readonly Phase[], seconds: number, phaseTrackIndex = 0): number {
  const index = phaseIndex(arc, seconds);
  const phase = arc[index]!;
  const start = arc[index - 1]?.endSeconds ?? 0;
  const progress = Math.min(1, Math.max(0, (seconds - start) / (phase.endSeconds - start)));
  if (index === 2) return phaseTrackIndex % 3 === 2 ? Math.max(phase.startEnergy - 1, 1) : phase.startEnergy + (phase.endEnergy - phase.startEnergy) * (phaseTrackIndex % 3);
  if (index === 4) return progress < .7 ? phase.startEnergy : phase.startEnergy + (phase.endEnergy - phase.startEnergy) * ((progress - .7) / .3);
  return phase.startEnergy + (phase.endEnergy - phase.startEnergy) * progress;
}

// Rendering samples the same target policy used by generation and track guidance.
// In an unfilled phase, nominal 3:30 slots illustrate its intended peak waves.
export function curvePoints(arc: readonly Phase[], index: number, placementStarts: readonly number[] = []): readonly (readonly [number, number])[] {
  const phase = arc[index]!;
  const start = arc[index - 1]?.endSeconds ?? 0;
  const duration = phase.endSeconds - start;
  const starts = placementStarts.filter(time => time >= start && time < phase.endSeconds);
  const slots = starts.length > 1 ? starts : Array.from({ length: Math.max(1, Math.ceil(duration / 210)) }, (_, i) => start + i * 210);
  const times = [...new Set([...slots, ...Array.from({ length: 21 }, (_, i) => start + duration * i / 20)])].sort((a, b) => a - b);
  return times.map(time => {
    const sample = Math.min(time, phase.endSeconds - .000001);
    const ordinal = slots.reduce((latest, slot, i) => slot <= sample ? i : latest, 0);
    return [time, targetEnergy(arc, sample, ordinal)] as const;
  });
}
