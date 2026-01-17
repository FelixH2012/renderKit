/**
 * AI Page Builder Plugin
 *
 * Gutenberg sidebar plugin to generate entire pages via Gemini AI.
 */

import { registerPlugin } from '@wordpress/plugins';
// @ts-ignore - WordPress types incomplete
import { PluginSidebar } from '@wordpress/edit-post';
// @ts-ignore
import { Button, TextareaControl, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-ignore
import { store as noticesStore } from '@wordpress/notices';
// @ts-ignore
import { createBlock } from '@wordpress/blocks';
import apiFetch from '@wordpress/api-fetch';
import { useState, useCallback } from '@wordpress/element';

// Icons
const AIIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
    </svg>
);

interface GeneratedBlock {
    blockName: string;
    attrs: Record<string, unknown>;
}

interface APIResponse {
    success: boolean;
    blocks: GeneratedBlock[];
}

const PageBuilderSidebar = () => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { createNotice } = useDispatch(noticesStore);

    // @ts-ignore - WordPress store types
    const { replaceBlocks, insertBlocks } = useDispatch('core/block-editor');

    const clientIds = useSelect((select: any) => {
        return select('core/block-editor').getBlockOrder();
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Bitte gib eine Beschreibung ein.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await apiFetch<APIResponse>({
                path: '/renderkit/v1/ai/generate-page',
                method: 'POST',
                data: {
                    prompt: prompt.trim(),
                    language: 'de',
                },
            });

            if (response.success && response.blocks?.length > 0) {
                // Convert API response to Gutenberg blocks
                const newBlocks = response.blocks
                    .filter((block) => block.blockName?.startsWith('renderkit/'))
                    .map((block) => {
                        try {
                            return createBlock(block.blockName, block.attrs || {});
                        } catch (e) {
                            console.warn(`Could not create block: ${block.blockName}`, e);
                            return null;
                        }
                    })
                    .filter(Boolean);

                if (newBlocks.length > 0) {
                    // Replace all existing blocks with new ones
                    if (clientIds.length > 0) {
                        replaceBlocks(clientIds, newBlocks);
                    } else {
                        insertBlocks(newBlocks);
                    }

                    createNotice('success', `✨ ${newBlocks.length} Blöcke generiert!`, {
                        type: 'snackbar',
                        isDismissible: true,
                    });

                    setPrompt('');
                } else {
                    setError('Keine gültigen Blöcke generiert.');
                }
            } else {
                setError('Keine Blöcke generiert. Versuche eine detailliertere Beschreibung.');
            }
        } catch (err: unknown) {
            console.error('AI Generation Error:', err);
            const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
            setError(`Fehler: ${message}`);
            createNotice('error', `AI Fehler: ${message}`, {
                type: 'snackbar',
                isDismissible: true,
            });
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, clientIds, replaceBlocks, insertBlocks, createNotice]);

    // Example prompts
    const examplePrompts = [
        'Landingpage für eine Bäckerei mit Hero, Produkt-Vorstellung und Kontaktformular',
        'Portfolio-Seite für einen Fotografen mit Galerie und FAQ',
        'Restaurant-Website mit Menü-Bereich und Reservierungsformular',
    ];

    return (
        <PluginSidebar
            name="renderkit-page-builder-ai"
            title="AI Page Builder"
            icon={<AIIcon />}
        >
            <div style={{ padding: '16px' }}>
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                        Beschreibe die Seite, die du erstellen möchtest. Die KI generiert automatisch passende Blöcke.
                    </p>
                </div>

                {/* Prompt Input */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        Seitenbeschreibung
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="z.B. Eine moderne Landingpage für einen Handwerksbetrieb mit Hero-Bereich, Leistungen, FAQ und Kontaktformular"
                        rows={5}
                        disabled={isGenerating}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                        }}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '12px',
                        background: '#fcf0f1',
                        border: '1px solid #d63638',
                        borderRadius: '4px',
                        color: '#d63638',
                        marginBottom: '16px',
                        fontSize: '13px',
                    }}>
                        {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                float: 'right',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    className="components-button is-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    {isGenerating ? (
                        <>
                            <Spinner /> Generiere Seite...
                        </>
                    ) : (
                        '✨ Seite generieren'
                    )}
                </button>

                {/* Warning */}
                {clientIds.length > 0 && (
                    <p style={{
                        fontSize: '11px',
                        color: '#d63638',
                        marginTop: '8px',
                        textAlign: 'center',
                    }}>
                        ⚠️ Bestehende Blöcke werden ersetzt
                    </p>
                )}

                {/* Divider */}
                <hr style={{ margin: '24px 0', borderColor: '#e0e0e0' }} />

                {/* Example Prompts */}
                <div>
                    <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#666',
                        marginBottom: '8px',
                    }}>
                        Beispiele
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {examplePrompts.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => setPrompt(example)}
                                disabled={isGenerating}
                                style={{
                                    background: '#f0f0f0',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: '#1e1e1e',
                                    lineHeight: '1.4',
                                }}
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p style={{
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '20px',
                    textAlign: 'center',
                }}>
                    Powered by Google Gemini
                </p>
            </div>
        </PluginSidebar>
    );
};

registerPlugin('renderkit-page-builder-ai', {
    render: PageBuilderSidebar,
    icon: <AIIcon />,
});
