export interface CookieBannerSetting {
    id: string;
    label: string;
    description: string;
    required?: boolean;
    enabledByDefault?: boolean;
    linkLabel?: string;
    linkUrl?: string;
}

export interface CookieBannerAttributes {
    message: string;
    policyLabel: string;
    policyUrl: string;
    acceptLabel: string;
    rejectLabel: string;
    manageLabel: string;
    saveLabel: string;
    theme: 'light' | 'dark';
    consentVersion: string;
    settings: CookieBannerSetting[];
}
