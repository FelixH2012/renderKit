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
    focalPoint: { x: number; y: number };
    imageScale: 'cover' | 'contain';
    buttonText: string;
    buttonUrl: string;
    theme: 'light' | 'dark';
}
