/**
 * Type definitions for the Example block
 */

export interface ExampleBlockAttributes {
    /**
     * Block title text
     */
    title: string;

    /**
     * Block description text
     */
    description: string;

    /**
     * Button label text
     */
    buttonText: string;

    /**
     * Number of times button has been clicked
     */
    clickCount: number;

    /**
     * Whether to show the click counter
     */
    showCounter: boolean;

    /**
     * Color variant for the block
     */
    variant: 'primary' | 'secondary' | 'accent';
}

/**
 * Props for the Edit component (Block Editor)
 */
export interface ExampleEditProps {
    attributes: ExampleBlockAttributes;
    setAttributes: (newAttributes: Partial<ExampleBlockAttributes>) => void;
    className?: string;
    isSelected?: boolean;
}

/**
 * Props for the View component (Frontend)
 */
export interface ExampleViewProps {
    attributes: ExampleBlockAttributes;
    className?: string;
}

/**
 * Default attribute values
 */
export const DEFAULT_ATTRIBUTES: ExampleBlockAttributes = {
    title: 'Welcome to RenderKit',
    description: 'This block is rendered with React and styled with Tailwind CSS.',
    buttonText: 'Click Me',
    clickCount: 0,
    showCounter: true,
    variant: 'primary',
};
