export type FooterTheme = 'light' | 'dark';

export interface FooterMenuItem {
    id: number;
    title: string;
    url: string;
}

export interface FooterAttributes {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    tagline: string;
    theme: FooterTheme;
}

export interface FooterViewAttributes extends FooterAttributes {
    menuItems: FooterMenuItem[];
}

