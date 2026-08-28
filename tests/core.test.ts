import { describe, expect, it } from 'vitest';
import { addBlank, answersMatch, clozeText, isBackup, normalizeAnswer, sentenceParts, toCsv, type Prompt } from '../src/core';

const prompt: Prompt = {
  id: 'prompt-1',
  sentence: 'Roots remember the rain.',
  blanks: [{ start: 6, end: 14, answer: 'remember' }],
  note: 'to keep something in mind',
  direction: 'auto',
  createdAt: '2026-08-28T00:00:00.000Z',
  updatedAt: '2026-08-28T00:00:00.000Z'
};

describe('answer matching', () => {
  it('ignores case, surrounding punctuation, and repeated spaces', () => {
    expect(normalizeAnswer('  “REMEMBER!” ')).toBe('remember');
    expect(answersMatch('café au lait', ' CAFÉ   AU LAIT.')).toBe(true);
  });

  it('does not strip meaningful diacritics', () => {
    expect(answersMatch('résumé', 'resume')).toBe(false);
  });
});

describe('blank authoring', () => {
  it('adds up to two sorted non-overlapping selections', () => {
    const first = addBlank([], 'moss grows slowly', 11, 17);
    const second = addBlank(first, 'moss grows slowly', 0, 4);
    expect(second.map((blank) => blank.answer)).toEqual(['moss', 'slowly']);
  });

  it('rejects overlap and empty selections', () => {
    expect(() => addBlank([{ start: 0, end: 4, answer: 'moss' }], 'moss grows', 2, 7)).toThrow(/overlaps/);
    expect(() => addBlank([], 'moss', 2, 2)).toThrow(/Select/);
  });

  it('builds stable display parts and cloze text', () => {
    expect(sentenceParts(prompt).map((part) => part.text)).toEqual(['Roots ', 'remember', ' the rain.']);
    expect(clozeText(prompt)).toBe('Roots ________ the rain.');
    expect(clozeText(prompt, true)).toBe(prompt.sentence);
  });
});

describe('portable data', () => {
  it('quotes CSV values and includes cloze markup', () => {
    const csv = toCsv([{ ...prompt, note: 'meaning, memory' }]);
    expect(csv).toContain('"Roots {{remember}} the rain."');
    expect(csv).toContain('"meaning, memory"');
  });

  it('accepts a structurally valid backup and rejects a broken one', () => {
    expect(isBackup({ version: 1, exportedAt: prompt.updatedAt, prompts: [prompt], attempts: [] })).toBe(true);
    expect(isBackup({ version: 1, prompts: [{ ...prompt, blanks: [] }], attempts: [] })).toBe(false);
  });
});
