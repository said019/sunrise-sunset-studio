import { describe, it, expect } from 'vitest';
import { inscriptionAmount } from './inscription';

describe('inscriptionAmount', () => {
    it('returns base price when client did NOT take trial today', () => {
        expect(inscriptionAmount({ basePrice: 500, trialPrice: 300, tookTrialToday: false })).toBe(500);
    });

    it('returns base price minus trial price when client DID take trial today', () => {
        expect(inscriptionAmount({ basePrice: 500, trialPrice: 300, tookTrialToday: true })).toBe(200);
    });

    it('floors at 0 if trial price exceeds base price', () => {
        expect(inscriptionAmount({ basePrice: 200, trialPrice: 300, tookTrialToday: true })).toBe(0);
    });

    it('returns exact base price when trial price is 0', () => {
        expect(inscriptionAmount({ basePrice: 500, trialPrice: 0, tookTrialToday: true })).toBe(500);
    });

    it('returns 0 when both prices are equal and trial taken today', () => {
        expect(inscriptionAmount({ basePrice: 300, trialPrice: 300, tookTrialToday: true })).toBe(0);
    });
});
