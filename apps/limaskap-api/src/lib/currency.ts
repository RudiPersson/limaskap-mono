/**
 * Currency conversion utilities for Danish Kroner
 */

/**
 * Converts øre (cents) to kroner
 * @param ore - Price in øre (e.g., 150000)
 * @returns Price in kroner as a number (e.g., 1500.00)
 */
export function oreToKroner(ore: number): number {
    return ore / 100;
}

/**
 * Converts kroner to øre (cents)
 * @param kroner - Price in kroner (e.g., 1500.00)
 * @returns Price in øre as an integer (e.g., 150000)
 */
export function kronerToOre(kroner: number): number {
    return Math.round(kroner * 100);
}

/**
 * Formats øre as a kroner string with currency symbol
 * @param ore - Price in øre (e.g., 150000)
 * @returns Formatted string (e.g., "1.500,00 kr")
 */
export function formatOreAsKroner(ore: number): string {
    const kroner = oreToKroner(ore);
    return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK',
        minimumFractionDigits: 2,
    }).format(kroner);
}
