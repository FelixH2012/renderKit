export type HeroTheme = 'dark' | 'light';
export type HeroVariant = 'full' | 'minimal';

export interface HeroAttributes {
    blockId?: string;
    heading: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    theme: HeroTheme;
    variant: HeroVariant;
}
