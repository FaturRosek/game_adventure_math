export class AdventureMissionState {
  constructor(modeConfig, callbacks = {}) {
    this.modeType = modeConfig?.modeType || "exploration";
    this.sequential = Boolean(modeConfig?.mission?.sequential);
    this.requireAllObjectivesForFinish = Boolean(
      modeConfig?.mission?.requireAllObjectivesForFinish,
    );

    this.objectives = (modeConfig?.mission?.objectives || []).map(
      (obj, index) => ({
        id: obj.id,
        label: obj.label,
        type: obj.type || "custom",
        current: 0,
        target: Math.max(1, Number(obj.target) || 1),
        required: obj.required !== false,
        completed: false,
        order: index,
      }),
    );

    const timerCfg = modeConfig?.timer || {};
    this.timerEnabled = Boolean(timerCfg.enabled && timerCfg.durationSec > 0);
    this.durationSec = Number(timerCfg.durationSec) || 0;
    this.remainingMs = this.durationSec * 1000;
    this.timerPaused = false;
    this.timerExpired = false;

    this.onObjectiveUpdated = callbacks.onObjectiveUpdated || null;
    this.onObjectiveCompleted = callbacks.onObjectiveCompleted || null;
    this.onTimerTick = callbacks.onTimerTick || null;
    this.onTimerExpired = callbacks.onTimerExpired || null;
    this._lastBroadcastSec = -1;
  }

  getActiveObjective() {
    if (this.sequential) {
      return (
        this.objectives.find((o) => !o.completed) ||
        this.objectives[this.objectives.length - 1] ||
        null
      );
    }
    return (
      this.objectives.find((o) => o.required && !o.completed) ||
      this.objectives.find((o) => !o.completed) ||
      null
    );
  }

  isObjectiveUnlocked(obj) {
    if (!this.sequential) return true;
    const firstIncomplete = this.objectives.find((o) => !o.completed);
    return !firstIncomplete || firstIncomplete.id === obj.id;
  }

  addObjective(def) {
    if (!def || !def.id || this.objectives.some((o) => o.id === def.id)) return;
    this.objectives.push({
      id: def.id,
      label: def.label || def.id,
      type: def.type || "custom",
      current: 0,
      target: Math.max(1, Number(def.target) || 1),
      required: def.required !== false,
      completed: false,
      order: this.objectives.length,
    });
    if (this.onObjectiveUpdated) this.onObjectiveUpdated(this.getSnapshot());
  }

  updateProgressById(id, delta = 1) {
    const obj = this.objectives.find((o) => o.id === id);
    if (!obj || obj.completed) return false;
    if (this.sequential && !this.isObjectiveUnlocked(obj)) return false;

    obj.current = Math.min(obj.target, Math.max(0, obj.current + delta));
    if (obj.current >= obj.target) {
      obj.completed = true;
      if (this.onObjectiveCompleted)
        this.onObjectiveCompleted(obj, this.getSnapshot());
    }
    if (this.onObjectiveUpdated) this.onObjectiveUpdated(this.getSnapshot());
    return true;
  }

  updateProgressByType(type, delta = 1) {
    let changed = false;
    for (const obj of this.objectives) {
      if (obj.type !== type || obj.completed) continue;
      if (this.sequential && !this.isObjectiveUnlocked(obj)) continue;
      obj.current = Math.min(obj.target, Math.max(0, obj.current + delta));
      changed = true;
      if (obj.current >= obj.target) {
        obj.completed = true;
        if (this.onObjectiveCompleted)
          this.onObjectiveCompleted(obj, this.getSnapshot());
      }
      if (this.sequential) break;
    }
    if (changed && this.onObjectiveUpdated) {
      this.onObjectiveUpdated(this.getSnapshot());
    }
    return changed;
  }

  areRequiredObjectivesComplete() {
    return this.objectives.filter((o) => o.required).every((o) => o.completed);
  }

  pauseTimer() {
    this.timerPaused = true;
  }

  resumeTimer() {
    this.timerPaused = false;
  }

  addTime(seconds) {
    if (!this.timerEnabled) return;
    this.remainingMs = Math.max(0, this.remainingMs + seconds * 1000);
    this.timerExpired = false;
    this._broadcastTimerIfChanged(true);
  }

  resetTimer() {
    if (!this.timerEnabled) return;
    this.remainingMs = this.durationSec * 1000;
    this.timerExpired = false;
    this._broadcastTimerIfChanged(true);
  }

  tick(deltaMs) {
    if (!this.timerEnabled || this.timerPaused || this.timerExpired) return;
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    this._broadcastTimerIfChanged(false);

    if (this.remainingMs <= 0) {
      this.timerExpired = true;
      if (this.onTimerExpired) this.onTimerExpired(this.getSnapshot());
    }
  }

  _broadcastTimerIfChanged(force) {
    const sec = Math.ceil(this.remainingMs / 1000);
    if (force || sec !== this._lastBroadcastSec) {
      this._lastBroadcastSec = sec;
      if (this.onTimerTick) {
        this.onTimerTick(sec, this.formatTime(sec));
      }
    }
  }

  formatTime(totalSec = Math.ceil(this.remainingMs / 1000)) {
    const clamped = Math.max(0, totalSec);
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  getSummaryText() {
    const active = this.getActiveObjective();
    if (!active) return "Menuju Garis Finis!";
    return `${active.label} (${active.current}/${active.target})`;
  }

  getSnapshot() {
    return {
      modeType: this.modeType,
      objectives: this.objectives.map((o) => ({ ...o })),
      activeObjective: this.getActiveObjective(),
      summaryText: this.getSummaryText(),
      allRequiredComplete: this.areRequiredObjectivesComplete(),
      timerEnabled: this.timerEnabled,
      remainingSec: Math.ceil(this.remainingMs / 1000),
      timerText: this.timerEnabled ? this.formatTime() : "",
    };
  }
}
