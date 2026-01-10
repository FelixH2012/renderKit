/**
 * Example Block - Frontend View Component
 *
 * This component is hydrated on the frontend for interactivity.
 * 
 * NOTE: This runs on the public frontend, NOT in the admin.
 * We use React directly here (not @wordpress/element) because
 * WordPress packages are not loaded on the frontend.
 */

import React, { useState, useCallback } from 'react';
import type { ExampleViewProps } from './types';

/**
 * Frontend view component for the Example block
 */
export function View({ attributes, className }: ExampleViewProps): JSX.Element {
    const { title, description, buttonText, clickCount: initialCount, showCounter, variant } =
        attributes;

    // Local state for click counter (demonstrates React interactivity)
    const [clickCount, setClickCount] = useState(initialCount);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = useCallback(() => {
        setClickCount((prev) => prev + 1);
        setIsAnimating(true);

        // Reset animation state
        setTimeout(() => setIsAnimating(false), 300);
    }, []);

    const variantClasses = {
        primary: 'rk-bg-gradient-to-br rk-from-indigo-500 rk-to-purple-600',
        secondary: 'rk-bg-gradient-to-br rk-from-purple-500 rk-to-pink-500',
        accent: 'rk-bg-gradient-to-br rk-from-cyan-500 rk-to-blue-500',
    };

    return (
        <div className={`renderkit-block renderkit-example ${className || ''}`}>
            <div
                className={`rk-rounded-xl rk-p-8 rk-text-white rk-shadow-xl rk-transition-all rk-duration-300 ${variantClasses[variant]}`}
            >
                <h2 className="rk-text-3xl rk-font-bold rk-mb-4">{title}</h2>

                <p className="rk-text-lg rk-opacity-90 rk-mb-6">{description}</p>

                <div className="rk-flex rk-items-center rk-gap-4 rk-flex-wrap">
                    <button
                        type="button"
                        onClick={handleClick}
                        className={`
              rk-px-6 rk-py-3 rk-bg-white rk-text-gray-900 rk-rounded-lg 
              rk-font-semibold rk-shadow-md rk-transition-all rk-duration-200
              hover:rk-scale-105 hover:rk-shadow-lg
              active:rk-scale-95
              ${isAnimating ? 'rk-scale-110' : ''}
            `}
                    >
                        {buttonText}
                    </button>

                    {showCounter && (
                        <div
                            className={`
                rk-flex rk-items-center rk-gap-2 rk-bg-white/20 rk-backdrop-blur-sm 
                rk-px-4 rk-py-2 rk-rounded-full rk-transition-all rk-duration-300
                ${isAnimating ? 'rk-scale-110' : ''}
              `}
                        >
                            <span className="rk-text-2xl">🎉</span>
                            <span className="rk-font-mono rk-text-lg rk-font-bold">
                                {clickCount}
                            </span>
                            <span className="rk-text-sm rk-opacity-75">
                                {clickCount === 1 ? 'click' : 'clicks'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Decorative elements */}
                <div className="rk-absolute rk-top-0 rk-right-0 rk-w-32 rk-h-32 rk-bg-white/10 rk-rounded-full rk-blur-2xl rk--translate-y-1/2 rk-translate-x-1/2" />
                <div className="rk-absolute rk-bottom-0 rk-left-0 rk-w-24 rk-h-24 rk-bg-white/10 rk-rounded-full rk-blur-xl rk-translate-y-1/2 rk--translate-x-1/2" />
            </div>
        </div>
    );
}

export default View;
