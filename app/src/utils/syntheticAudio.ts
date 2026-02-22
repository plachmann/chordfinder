// Generates synthetic 16-bit PCM audio (mono, 16kHz) for a set of frequencies.
// Used in demo mode so the API pipeline can be tested without a real microphone.

const SAMPLE_RATE = 16000;
const CHUNK_DURATION_MS = 250;
const SAMPLES_PER_CHUNK = (SAMPLE_RATE * CHUNK_DURATION_MS) / 1000; // 4000

// Fundamental frequencies (Hz) for each chord root + quality.
// Simple triad: root, major/minor third, perfect fifth.
export const DEMO_PROGRESSION: Array<{ name: string; freqs: number[] }> = [
  { name: "C",  freqs: [261.63, 329.63, 392.00] }, // C major
  { name: "Am", freqs: [220.00, 261.63, 329.63] }, // A minor
  { name: "F",  freqs: [174.61, 220.00, 261.63] }, // F major
  { name: "G",  freqs: [196.00, 246.94, 293.66] }, // G major
  { name: "C",  freqs: [261.63, 329.63, 392.00] }, // C major
  { name: "Am", freqs: [220.00, 261.63, 329.63] }, // A minor
  { name: "Dm", freqs: [146.83, 174.61, 220.00] }, // D minor
  { name: "G",  freqs: [196.00, 246.94, 293.66] }, // G major
];

// Chunks per chord — how many 250ms PCM frames to send before advancing
export const CHUNKS_PER_CHORD = 8; // 2 seconds per chord

/**
 * Generate one 250ms chunk of PCM for the given frequencies.
 * Returns an ArrayBuffer of Int16 samples (little-endian, mono, 16kHz).
 */
export function generatePCMChunk(freqs: number[], chunkIndex: number): ArrayBuffer {
  const buf = new Int16Array(SAMPLES_PER_CHUNK);
  const offset = chunkIndex * SAMPLES_PER_CHUNK; // continuous phase across chunks
  for (let i = 0; i < SAMPLES_PER_CHUNK; i++) {
    let sample = 0;
    for (const freq of freqs) {
      sample += Math.sin((2 * Math.PI * freq * (offset + i)) / SAMPLE_RATE);
    }
    sample /= freqs.length;
    buf[i] = Math.round(sample * 0.8 * 32767);
  }
  return buf.buffer;
}
