/**
 * Text-Image Block - Types
 */

export interface TextImageAttributes {
    heading: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    imageId: number;
    imagePosition: 'left' | 'right';
    buttonText: string;
    buttonUrl: string;
    theme: 'light' | 'dark';
}
