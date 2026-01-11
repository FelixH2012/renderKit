export interface ContactFormAttributes {
    nameLabel: string;
    emailLabel: string;
    subjectLabel: string;
    messageLabel: string;
    submitButtonText: string;
    theme: 'light' | 'dark';
    recaptchaSiteKey?: string;
    recaptchaEnabled?: boolean;
    nonce?: string;
    privacyLabel?: string;
    privacyRequired?: boolean;
    status?: string;
    successMessage?: string;
    errorMessage?: string;
}
