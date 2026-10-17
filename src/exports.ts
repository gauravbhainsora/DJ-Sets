import type { Recording } from './catalog';
import { constraintNotes, elapsedTimes, energyFor, formatTime, guidance, totalSeconds, type SetPlan } from './set-plan';
import { localFilePath, matchRecording } from './local-library';

function exportRows(plan: SetPlan, catalog: readonly Recording[]) {
  const elapsed = elapsedTimes(plan);
  return plan.placements.map((placement, index) => {
    const recording = catalog.find(item => item.id === placement.recordingId)!;
    const energy = energyFor(plan, recording);
    const assessment = guidance(plan, catalog, index);
    const match = matchRecording(recording, plan.library, plan.librarySelections[recording.id]);
    return {
      position: index + 1, recording_id: recording.id, artist: recording.artists.join(', '), title: recording.title, version: recording.version,
      genre: recording.genre, bpm: recording.bpm ?? 'Unknown', key: recording.key ?? 'Unknown', full_length_seconds: recording.durationSeconds ?? 'Unknown',
      energy: energy?.value ?? 'Unknown', energy_basis: energy?.basis ?? 'Unknown', energy_confidence: energy?.confidence ?? 'Unknown', energy_kind: energy?.kind ?? 'Unknown',
      metadata_source: recording.metadataSource, metadata_checked: recording.verifiedOn ?? 'Unknown',
      phase: assessment.phase, target_energy: assessment.target.toFixed(1), elapsed_seconds: elapsed[index]!, play_seconds: placement.playSeconds, overlap_seconds: placement.overlapSeconds,
      role: assessment.role, transition: assessment.transition, locked: placement.locked, position_pin: placement.pin ?? 'None', notes: placement.annotation, source_url: recording.sourceUrl,
      must_include: plan.mustInclude.includes(recording.id), required_recordings: JSON.stringify(plan.mustInclude),
      performance_context: plan.context, selected_genres: plan.genres.join('; '), genre_emphasis: JSON.stringify(plan.emphasis), target_seconds: plan.targetSeconds,
      estimated_total_seconds: totalSeconds(plan), energy_arc: JSON.stringify(plan.arc), constraints: constraintNotes(plan, catalog).join('\n'),
      local_match: match.status, local_file_reference: match.entry ? localFilePath(match.entry.location) : 'Unknown', local_file_availability: 'Unverified',
    };
  });
}

export function csvForPlan(plan: SetPlan, catalog: readonly Recording[]): string {
  const rows = exportRows(plan, catalog);
  if (!rows.length) throw new Error('No tracks to export.');
  const quote = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  return '\uFEFF' + [Object.keys(rows[0]!).map(quote).join(','), ...rows.map(row => Object.values(row).map(quote).join(','))].join('\r\n') + '\r\n';
}

export function textForPlan(name: string, plan: SetPlan, catalog: readonly Recording[]): string {
  const lines = [name, `Genres: ${plan.genres.join(', ')}`, `Genre emphasis: ${JSON.stringify(plan.emphasis)}`, `Must-include recordings: ${plan.mustInclude.join(', ') || 'None'}`, `Performance context: ${plan.context || 'Unspecified'}`, `Target: ${formatTime(plan.targetSeconds)}; estimated duration: ${formatTime(totalSeconds(plan))}`, 'Energy arc (target energy, not measured track energy):', ...plan.arc.map(phase => `${phase.name}: ends at ${formatTime(Math.round(phase.endSeconds))}; ${phase.startEnergy} → ${phase.endEnergy}/10`), ...constraintNotes(plan, catalog), ''];
  for (const row of exportRows(plan, catalog)) lines.push(
    `${row.position}. ${row.artist} — ${row.title} (${row.version})`,
    `Recording ID: ${row.recording_id}; ${row.genre}; BPM: ${row.bpm}; Key: ${row.key}; Full recording length: ${row.full_length_seconds} seconds`,
    `Track energy: ${row.energy}; basis: ${row.energy_basis}; confidence: ${row.energy_confidence}; kind: ${row.energy_kind}`,
    `Phase: ${row.phase}; target energy: ${row.target_energy}; ${row.role}`,
    `Elapsed: ${formatTime(row.elapsed_seconds)}; Planned play: ${formatTime(row.play_seconds)}; overlap before: ${formatTime(row.overlap_seconds)}`,
    `Transition: ${row.transition}`, `Must-include: ${row.must_include}; Inclusion lock: ${row.locked}; position pin: ${row.position_pin}`, `Notes: ${row.notes}`, `Metadata: ${row.metadata_source}; checked ${row.metadata_checked}`, `Source: ${row.source_url}`, `Local library: ${row.local_match}; file reference: ${row.local_file_reference}; availability: ${row.local_file_availability}`, '',
  );
  return lines.join('\n');
}

export function localPlaylist(plan: SetPlan, catalog: readonly Recording[]): { content: string; omitted: readonly string[]; count: number } {
  const lines = ['#EXTM3U'];
  const omitted: string[] = [];
  let count = 0;
  for (const placement of plan.placements) {
    const recording = catalog.find(item => item.id === placement.recordingId)!;
    const match = matchRecording(recording, plan.library, plan.librarySelections[recording.id]);
    if (!match.entry) { omitted.push(`${recording.artists.join(', ')} — ${recording.title} (${recording.version}): ${match.status}`); continue; }
    const description = `${recording.artists.join(', ')} — ${recording.title} (${recording.version})`.replace(/[\r\n]/g, ' ');
    lines.push(`#EXTINF:${recording.durationSeconds ?? -1},${description}`, localFilePath(match.entry.location));
    count++;
  }
  if (!count) throw new Error('No recordings have confirmed local-library matches. Import a Rekordbox XML library and resolve exact-version matches first.');
  return { content: lines.join('\n') + '\n', omitted, count };
}
