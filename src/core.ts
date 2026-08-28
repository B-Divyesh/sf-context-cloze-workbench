export type Direction = 'auto' | 'ltr' | 'rtl';

export interface Blank {
  start: number;
  end: number;
  answer: string;
}

export interface Prompt {
  id: string;
  sentence: string;
  blanks: Blank[];
  note: string;
  direction: Direction;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  promptId: string;
  answers: string[];
  correct: boolean;
  createdAt: string;
}

export interface Backup {
  version: 1;
  exportedAt: string;
  prompts: Prompt[];
  attempts: Attempt[];
}

export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/^\p{P}+|\p{P}+$/gu, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

export function answersMatch(expected: string, actual: string): boolean {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

export function addBlank(blanks: Blank[], sentence: string, start: number, end: number): Blank[] {
  if (blanks.length >= 2) throw new Error('A prompt can have at most two blanks.');
  if (start < 0 || end > sentence.length || start >= end) {
    throw new Error('Select the word or phrase you want to hide.');
  }

  const answer = sentence.slice(start, end);
  if (!answer.trim()) throw new Error('A blank cannot contain only spaces.');
  if (blanks.some((blank) => start < blank.end && end > blank.start)) {
    throw new Error('That selection overlaps an existing blank.');
  }

  return [...blanks, { start, end, answer }].sort((a, b) => a.start - b.start);
}

export function sentenceParts(prompt: Pick<Prompt, 'sentence' | 'blanks'>): Array<{ text: string; blank?: Blank }> {
  const parts: Array<{ text: string; blank?: Blank }> = [];
  let cursor = 0;
  for (const blank of [...prompt.blanks].sort((a, b) => a.start - b.start)) {
    if (blank.start > cursor) parts.push({ text: prompt.sentence.slice(cursor, blank.start) });
    parts.push({ text: blank.answer, blank });
    cursor = blank.end;
  }
  if (cursor < prompt.sentence.length) parts.push({ text: prompt.sentence.slice(cursor) });
  return parts;
}

export function clozeText(prompt: Pick<Prompt, 'sentence' | 'blanks'>, reveal = false): string {
  return sentenceParts(prompt)
    .map((part) => part.blank ? (reveal ? part.blank.answer : '________') : part.text)
    .join('');
}

export function toCsv(prompts: Prompt[]): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const header = ['sentence', 'cloze', 'answers', 'note', 'direction', 'created_at', 'updated_at'];
  const rows = prompts.map((prompt) => [
    prompt.sentence,
    sentenceParts(prompt).map((part) => part.blank ? `{{${part.blank.answer}}}` : part.text).join(''),
    prompt.blanks.map((blank) => blank.answer).join(' | '),
    prompt.note,
    prompt.direction,
    prompt.createdAt,
    prompt.updatedAt
  ]);
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}

export function isBackup(value: unknown): value is Backup {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Backup>;
  return candidate.version === 1 && Array.isArray(candidate.prompts) && Array.isArray(candidate.attempts)
    && candidate.prompts.every(isPrompt);
}

function isPrompt(value: unknown): value is Prompt {
  if (!value || typeof value !== 'object') return false;
  const prompt = value as Partial<Prompt>;
  return typeof prompt.id === 'string' && typeof prompt.sentence === 'string'
    && typeof prompt.note === 'string' && ['auto', 'ltr', 'rtl'].includes(prompt.direction ?? '')
    && Array.isArray(prompt.blanks) && prompt.blanks.length > 0 && prompt.blanks.length <= 2
    && prompt.blanks.every((blank) => Number.isInteger(blank.start) && Number.isInteger(blank.end)
      && typeof blank.answer === 'string' && blank.start >= 0 && blank.end <= prompt.sentence!.length
      && prompt.sentence!.slice(blank.start, blank.end) === blank.answer);
}

export function recentAccuracy(attempts: Attempt[]): number | null {
  if (!attempts.length) return null;
  const recent = attempts.slice(-20);
  return Math.round(recent.filter((attempt) => attempt.correct).length / recent.length * 100);
}
