import { describe, expect, it } from 'vitest';

import { calculateFieldTypeScore } from './scoring';

describe('autofill field scoring', () => {
  it('treats a generic start date as sensitive rather than education', () => {
    const input = document.createElement('input');
    input.name = 'start_date';
    input.id = 'start_date';

    expect(calculateFieldTypeScore(input, 'education_start_date')).toBe(0);
    expect(
      calculateFieldTypeScore(input, 'available_start_date')
    ).toBeGreaterThan(0);
  });

  it('recognizes an explicitly scoped education start date', () => {
    const input = document.createElement('input');
    input.name = 'education_start_date';

    expect(
      calculateFieldTypeScore(input, 'education_start_date')
    ).toBeGreaterThan(0);
  });
});
