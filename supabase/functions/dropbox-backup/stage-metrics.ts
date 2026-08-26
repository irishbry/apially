/**
 * Structured stage logging for backup runs.
 *
 * Every line is a single-line JSON object prefixed with `BACKUP_STAGE` so a log
 * search can isolate them and see exactly which stage (scan / csv / upload /
 * finalize) was running when a source stalled or timed out.
 */

export type BackupStage = 'scan' | 'fetch' | 'csv' | 'upload' | 'finalize' | 'source';

export interface StageContext {
  runId: string;
  userId: string;
  sourceId: string;
  sourceName: string;
  dateString: string;
}

export interface StageMetrics {
  rows?: number;
  bytes?: number;
  pages?: number;
  columns?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface StageLogger {
  /** Emit a point-in-time event for a stage. */
  event(stage: BackupStage, metrics?: StageMetrics): void;
  /** Time an async stage, emitting start/end (or error) lines with duration. */
  time<T>(stage: BackupStage, run: () => Promise<T>, metrics?: () => StageMetrics): Promise<T>;
  /** Emit a failure line for a stage. */
  fail(stage: BackupStage, error: unknown, metrics?: StageMetrics): void;
  /** Totals accumulated per stage, in milliseconds. */
  totals(): Record<string, number>;
  /** Milliseconds since the logger was created. */
  elapsedMs(): number;
}

export function createStageLogger(context: StageContext): StageLogger {
  const startedAt = Date.now();
  const totals: Record<string, number> = {};

  const emit = (stage: BackupStage, phase: string, extra: Record<string, unknown>) => {
    console.log(`BACKUP_STAGE ${JSON.stringify({
      ...context,
      stage,
      phase,
      at: new Date().toISOString(),
      sinceStartMs: Date.now() - startedAt,
      ...extra,
    })}`);
  };

  return {
    event(stage, metrics = {}) {
      emit(stage, 'event', metrics);
    },
    async time(stage, run, metrics) {
      const stageStart = Date.now();
      emit(stage, 'start', metrics?.() ?? {});
      try {
        const result = await run();
        const durationMs = Date.now() - stageStart;
        totals[stage] = (totals[stage] ?? 0) + durationMs;
        emit(stage, 'end', { durationMs, ...(metrics?.() ?? {}) });
        return result;
      } catch (error) {
        const durationMs = Date.now() - stageStart;
        totals[stage] = (totals[stage] ?? 0) + durationMs;
        emit(stage, 'error', {
          durationMs,
          error: error instanceof Error ? error.message : String(error),
          ...(metrics?.() ?? {}),
        });
        throw error;
      }
    },
    fail(stage, error, metrics = {}) {
      emit(stage, 'error', {
        error: error instanceof Error ? error.message : String(error),
        ...metrics,
      });
    },
    totals() {
      return { ...totals };
    },
    elapsedMs() {
      return Date.now() - startedAt;
    },
  };
}
