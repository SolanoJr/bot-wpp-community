import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

/** Transcreve um arquivo local via faster-whisper (Python, CPU, sem API). */
export async function transcribeAudioFile(filePath: string): Promise<string> {
  const script = path.join(process.cwd(), 'scripts', 'transcribe_audio.py');
  const { stdout } = await execFileAsync('python3', [script, filePath], {
    timeout: 180_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, STT_MODEL: process.env.STT_MODEL || 'small' },
  });
  return String(stdout || '').trim();
}
