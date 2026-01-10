/**
 * Hero Block - Frontend View Component
 * 
 * Hydrated on the frontend with scroll-based animations.
 */

import React, { Fragment } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { HeroAttributes } from './editor';

interface ViewProps {
    attributes: HeroAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const { heading, description, buttonText, buttonUrl, stat1Label, stat1Value, stat2Label, stat2Value, theme: colorTheme, enableAnimations } = attributes;

    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const isDark = colorTheme === 'dark';
    const textColor = isDark ? '#FFFEF9' : '#1A1816';
    const mutedColor = isDark ? 'rgba(255,254,249,0.6)' : 'rgba(26,24,22,0.6)';
    const bgColor = isDark ? '#000000' : '#FFFEF9';

    const headingLines = heading.split('\n');

    const fadeInUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } };
    const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

    return (
        <section className={`renderkit-block renderkit-hero renderkit-hero--${colorTheme} ${className || ''}`} style={{ backgroundColor: bgColor, color: textColor }}>
            {/* Parallax background */}
            <motion.div className="absolute inset-0" style={enableAnimations ? { y } : undefined}>
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '64px 64px' }} />
            </motion.div>

            <motion.div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-16 py-32" style={enableAnimations ? { opacity } : undefined}>
                {/* Gold bar */}
                <motion.div className="mb-16" initial={enableAnimations ? 'hidden' : false} animate="visible" variants={fadeIn} transition={{ duration: 1, delay: 0.3 }}>
                    <div className="w-12 h-px bg-gold" style={{ backgroundColor: '#B8975A' }} />
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <motion.div className="lg:col-span-8" initial={enableAnimations ? 'hidden' : false} animate="visible" variants={fadeInUp} transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                        <h1 className="rk-heading-display mb-8" style={{ color: textColor }}>
                            {headingLines.map((line, i) => (
                                <Fragment key={i}>{line}{i < headingLines.length - 1 && <br />}</Fragment>
                            ))}
                        </h1>
                    </motion.div>

                    <motion.div className="lg:col-span-4 space-y-8" initial={enableAnimations ? 'hidden' : false} animate="visible" variants={fadeInUp} transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                        <p className="max-w-sm" style={{ color: mutedColor, fontSize: '1.125rem', lineHeight: '1.8' }}>{description}</p>

                        <motion.a href={buttonUrl} className="inline-flex items-center gap-4 transition-colors" style={{ color: textColor }} whileHover={enableAnimations ? { x: 8 } : undefined}>
                            <span className="text-sm tracking-[0.2em] uppercase font-medium">{buttonText}</span>
                            <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                        </motion.a>
                    </motion.div>
                </div>

                {/* Stats */}
                <motion.div className="mt-32 grid grid-cols-1 lg:grid-cols-12 gap-8" initial={enableAnimations ? 'hidden' : false} animate="visible" variants={fadeIn} transition={{ duration: 1, delay: 1.2 }}>
                    <div className="lg:col-start-9 lg:col-span-4">
                        <div className="flex items-baseline gap-6" style={{ color: mutedColor }}>
                            <div>
                                <span className="block text-xs tracking-wider uppercase mb-1">{stat1Label}</span>
                                <span className="text-2xl font-light" style={{ color: textColor }}>{stat1Value}</span>
                            </div>
                            <div className="w-px h-12" style={{ backgroundColor: mutedColor }} />
                            <div>
                                <span className="block text-xs tracking-wider uppercase mb-1">{stat2Label}</span>
                                <span className="text-2xl font-light" style={{ color: textColor }}>{stat2Value}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}

export default View;
