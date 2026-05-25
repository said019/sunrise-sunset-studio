/**
 * inscription.ts — Pure pricing logic for the Inscripción plan.
 *
 * Business rule: if a client enrolls (pays Inscripción) the same calendar day
 * they took their Clase Muestra trial, the trial cost ($300) is discounted from
 * the inscription base price ($500), yielding $200. Price floors at 0.
 */

export interface InscriptionAmountParams {
    /** Base price of the Inscripción plan (e.g. 500) */
    basePrice: number;
    /** Price of the Clase Muestra trial plan (e.g. 300) */
    trialPrice: number;
    /** True when the client has a Clase Muestra membership created today (Mexico City time) */
    tookTrialToday: boolean;
}

/**
 * Returns the amount the client should pay for the Inscripción plan.
 * Pure function — no side effects, no I/O.
 */
export function inscriptionAmount({ basePrice, trialPrice, tookTrialToday }: InscriptionAmountParams): number {
    if (!tookTrialToday) {
        return basePrice;
    }
    return Math.max(basePrice - trialPrice, 0);
}
