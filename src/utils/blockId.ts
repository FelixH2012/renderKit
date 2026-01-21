/**
 * Block ID Utility
 * 
 * Generates unique IDs for RenderKit blocks.
 */

/**
 * Generates a unique block ID with the format: rk-{blockType}-{randomString}
 * 
 * @param blockType - The type of block (e.g., 'hero', 'faq')
 * @returns A unique ID string
 */
export function generateBlockId(blockType: string): string {
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `rk-${blockType}-${randomPart}`;
}

/**
 * Validates if a string is a valid RenderKit block ID
 * 
 * @param id - The ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidBlockId(id: string | undefined): boolean {
    if (!id) return false;
    return /^rk-[a-z-]+-[a-z0-9]{6}$/.test(id);
}
