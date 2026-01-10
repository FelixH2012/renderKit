export type HeroTheme = 'dark' | 'light';

export interface HeroAttributes {
    heading: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    theme: HeroTheme;
    enableAnimations: boolean;
}

