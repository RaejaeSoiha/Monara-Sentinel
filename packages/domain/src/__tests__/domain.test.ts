import { describe, it, expect } from 'vitest';
import { CaseStatus, CasePriority, InvestigationStatus, RoleName } from '../index';

describe('Domain enums', () => {
  it('exports expected enums', () => {
    expect(CaseStatus.OPEN).toBe('OPEN');
    expect(CasePriority.CRITICAL).toBe('CRITICAL');
    expect(InvestigationStatus.ACTIVE).toBe('ACTIVE');
    expect(RoleName.OWNER).toBe('OWNER');
  });
});
