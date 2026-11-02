/*
 * ZzFX sound. The zzfx module creates its AudioContext on import, so it is
 * imported lazily on the first user gesture (browsers block audio before).
 * Randomness parameter is always 0: deterministic sounds.
 */
type Zzfx = typeof import('zzfx');
let mod: Zzfx | null = null;
let loading: Promise<void> | null = null;

export function unlockAudio(): Promise<void> {
  if (mod) {
    void mod.ZZFX.audioContext.resume().catch(() => {});
    return Promise.resolve();
  }
  loading ??= import('zzfx')
    .then((m) => {
      mod = m;
      m.ZZFX.volume = 0.25;
      return m.ZZFX.audioContext.resume().catch(() => {});
    })
    .catch(() => {
      loading = null; // audio unavailable; game stays silent
    });
  return loading;
}

// zzfx params: volume, randomness, frequency, attack, sustain, release, shape,
// shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise,
// modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter
const SOUNDS = {
  /** soft, eerie, rising */
  soul: [0.7, 0, 180, 0.25, 0.35, 0.9, 0, 1.4, 1.6, 0, 0, 0, 0, 0, 2.5, 0, 0.18, 0.7, 0.1, 0.35, 900],
} as const;

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName): void {
  const run = () => {
    try {
      mod?.zzfx(...SOUNDS[name]);
    } catch {
      /* ignore audio failures */
    }
  };
  if (mod) run();
  else void unlockAudio().then(run);
}
