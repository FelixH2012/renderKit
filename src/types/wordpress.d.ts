/**
 * WordPress Block Editor type declarations
 */

declare module '@wordpress/blocks' {
    export function registerBlockType(
        name: string,
        settings: Record<string, any>
    ): any;

    export function unregisterBlockType(name: string): any;

    export function getBlockType(name: string): any;
}

declare module '@wordpress/block-editor' {
    export function useBlockProps(props?: Record<string, any>): Record<string, any>;

    export function InspectorControls(props: {
        children: React.ReactNode;
    }): JSX.Element;

    export function BlockControls(props: {
        children: React.ReactNode;
        group?: string;
    }): JSX.Element;

    export function RichText(props: {
        tagName: string;
        className?: string;
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
        allowedFormats?: string[];
    }): JSX.Element;

    export function MediaUpload(props: Record<string, any>): JSX.Element;

    export function InnerBlocks(props?: Record<string, any>): JSX.Element;

    export function AlignmentToolbar(props: Record<string, any>): JSX.Element;
}

declare module '@wordpress/components' {
    export function PanelBody(props: {
        title?: string;
        initialOpen?: boolean;
        children: React.ReactNode;
    }): JSX.Element;

    export function TextControl(props: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        help?: string;
    }): JSX.Element;

    export function TextareaControl(props: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        help?: string;
    }): JSX.Element;

    export function ToggleControl(props: {
        label: string;
        checked: boolean;
        onChange: (value: boolean) => void;
        help?: string;
    }): JSX.Element;

    export function SelectControl(props: {
        label: string;
        value: string;
        options: Array<{ label: string; value: string }>;
        onChange: (value: string) => void;
        help?: string;
    }): JSX.Element;

    export function RangeControl(props: {
        label: string;
        value: number;
        onChange: (value: number) => void;
        min?: number;
        max?: number;
        step?: number;
    }): JSX.Element;

    export function ColorPalette(props: Record<string, any>): JSX.Element;

    export function Button(props: {
        variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
        isPressed?: boolean;
        icon?: any;
        onClick?: () => void;
        children?: React.ReactNode;
    }): JSX.Element;

    export function Placeholder(props: {
        icon?: any;
        label?: string;
        instructions?: string;
        children?: React.ReactNode;
    }): JSX.Element;

    export function Spinner(): JSX.Element;
}

declare module '@wordpress/element' {
    export const useState: typeof import('react').useState;
    export const useEffect: typeof import('react').useEffect;
    export const useCallback: typeof import('react').useCallback;
    export const useMemo: typeof import('react').useMemo;
    export const useRef: typeof import('react').useRef;
    export const useContext: typeof import('react').useContext;
    export const createContext: typeof import('react').createContext;
    export const createElement: typeof import('react').createElement;
    export const Fragment: typeof import('react').Fragment;
    export const Component: typeof import('react').Component;
}

declare module '@wordpress/i18n' {
    export function __(text: string, domain?: string): string;
    export function _n(single: string, plural: string, count: number, domain?: string): string;
    export function _x(text: string, context: string, domain?: string): string;
    export function sprintf(format: string, ...args: any[]): string;
}

declare module '*.json' {
    const value: any;
    export default value;
}
