export type NavigationTheme = 'light' | 'dark';

export interface MenuItem {
    id: number;
    title: string;
    url: string;
}

export interface NavigationAttributes {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    sticky: boolean;
    theme: NavigationTheme;
    showCart: boolean;
}

export interface NavigationViewAttributes extends NavigationAttributes {
    menuItems: MenuItem[];
}

