import type { Genre, Recording } from './catalog';

export interface TrackPlacement {
  readonly id: string;
  readonly recordingId: Recording['id'];
}

export interface SetPlan {
  readonly id: string;
  readonly genre: Genre;
  readonly placements: readonly TrackPlacement[];
}

// A recording keeps its identity across plans; a placement belongs to one plan.
// This first slice uses catalog order. Musical sequencing comes in later slices.
export function createSetPlan(catalog: readonly Recording[], genre: Genre): SetPlan {
  return {
    id: crypto.randomUUID(),
    genre,
    placements: catalog
      .filter(recording => recording.genre === genre)
      .map(recording => ({ id: crypto.randomUUID(), recordingId: recording.id })),
  };
}
