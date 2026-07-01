import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageCode, languageNameMap } from "@/utils/language";
import { translateText } from "@/utils/translate";

interface Word {
    text: string;
    start_time: number;
    end_time: number;
}

interface Transcript {
    speaker: string | null;
    speaker_id: string | null;
    transcription_provider_speaker?: string;
    language: string | null;
    original_transcript_id: number;
    words: Word[];
    is_final: boolean;
}

interface TranscriptMessage {
    bot_id: string;
    transcript: Transcript;
}

export interface TranslationLine {
    language: LanguageCode;
    label: string;
    text: string;
    color: string;
}

interface Utterance {
    id: string;
    speaker: string | null;
    original: string;
    translations: TranslationLine[];
    sortKey: number;
}

const RECONNECT_RETRY_INTERVAL_MS = 3000;
const MAX_UTTERANCES = 10;
const CLEAR_INTERVAL_MS = 60000;

// Time window to coalesce rapid consecutive finals from the same speaker.
// If a new final arrives within this window from the same speaker,
// it gets merged into the previous utterance instead of creating a new one.
const COALESCE_WINDOW_MS = 1500;

const TRANSLATION_LANGUAGES: TranslationLine[] = [
    {
        language: LanguageCode.English,
        label: languageNameMap[LanguageCode.English],
        text: "",
        color: "#60a5fa",
    },
    {
        language: LanguageCode.Spanish,
        label: languageNameMap[LanguageCode.Spanish],
        text: "",
        color: "#facc15",
    },
];

const getTranslationLines = (): TranslationLine[] =>
    TRANSLATION_LANGUAGES.map((t) => ({ ...t }));

export const useTranscriptWebSocket = (wsUrl: string) => {
    const wsRef = useRef<WebSocket | null>(null);
    const retryIntervalRef = useRef<number | null>(null);
    const transcriptOrderRef = useRef<Map<number, number>>(new Map());
    const nextTranscriptOrderRef = useRef(0);

    // Track the last finalized utterance info for coalescing rapid finals
    const lastFinalRef = useRef<{
        speaker: string | null;
        utteranceId: string;
        sortKey: number;
        timestamp: number;
    } | null>(null);

    // Track coalesce timer so we can debounce translation for coalesced utterances
    const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track which original_transcript_ids have already been finalized,
    // so re-finals for the same ID update in place instead of duplicating.
    const finalizedIdsRef = useRef<Set<number>>(new Set());

    const [finalizedUtterances, setFinalizedUtterances] = useState<Utterance[]>(
        []
    );
    // Map of active partial utterances keyed by original_transcript_id
    // so multiple speakers' partials can coexist without overwriting each other.
    const [currentUtterances, setCurrentUtterances] = useState<
        Map<number, Utterance>
    >(new Map());

    useEffect(() => {
        // Queue for processing final transcripts one at a time.
        // Each final waits for its translation to complete before the next is processed.
        const finalQueue: (() => Promise<void>)[] = [];
        let isProcessingQueue = false;

        const processQueue = async () => {
            if (isProcessingQueue) return;
            isProcessingQueue = true;

            while (finalQueue.length > 0) {
                const task = finalQueue.shift()!;
                await task();
            }

            isProcessingQueue = false;
        };

        const getTranscriptSortKey = (transcriptId: number): number => {
            const existingSortKey = transcriptOrderRef.current.get(transcriptId);

            if (existingSortKey !== undefined) {
                return existingSortKey;
            }

            const nextSortKey = nextTranscriptOrderRef.current + 1;
            nextTranscriptOrderRef.current = nextSortKey;
            transcriptOrderRef.current.set(transcriptId, nextSortKey);

            return nextSortKey;
        };

        const updateFinalizedUtteranceTranslation = (
            utteranceId: string,
            language: LanguageCode,
            translated: string
        ) => {
            setFinalizedUtterances((prev) =>
                prev.map((item) =>
                    item.id === utteranceId
                        ? {
                              ...item,
                              translations: item.translations.map(
                                  (translation) =>
                                      translation.language === language
                                          ? {
                                                ...translation,
                                                text: translated,
                                            }
                                          : translation
                              ),
                          }
                        : item
                )
            );
        };

        const readUtteranceText = (utteranceId: string): Promise<string> => {
            return new Promise((resolve) => {
                setFinalizedUtterances((prev) => {
                    const utterance = prev.find((u) => u.id === utteranceId);
                    resolve(utterance?.original || "");
                    return prev; // no mutation, just reading
                });
            });
        };

        const translateFinalUtterance = async (
            utteranceId: string,
            languages: LanguageCode[]
        ) => {
            // Read the current text from state at translation time,
            // so coalesced appends are included
            const originalText = await readUtteranceText(utteranceId);

            if (!originalText) return;

            await Promise.all(
                languages.map(async (language) => {
                    const translated = await translateText(
                        originalText,
                        language
                    );

                    updateFinalizedUtteranceTranslation(
                        utteranceId,
                        language,
                        translated
                    );
                })
            );
        };

        const scheduleTranslation = (
            utteranceId: string,
            languages: LanguageCode[]
        ) => {
            // Clear any pending coalesce translation timer
            if (coalesceTimerRef.current) {
                clearTimeout(coalesceTimerRef.current);
                coalesceTimerRef.current = null;
            }

            // Debounce: wait a short period for more words to coalesce,
            // then queue the translation
            coalesceTimerRef.current = setTimeout(() => {
                coalesceTimerRef.current = null;

                // Reset translation lines to show "(Translating...)" fresh
                setFinalizedUtterances((prev) =>
                    prev.map((item) =>
                        item.id === utteranceId
                            ? {
                                  ...item,
                                  translations: getTranslationLines(),
                              }
                            : item
                    )
                    );

                finalQueue.push(async () => {
                    await translateFinalUtterance(utteranceId, languages);
                });

                processQueue();
            }, COALESCE_WINDOW_MS);
        };

        const handleTranscriptMessage = async (event: MessageEvent) => {
            const message = JSON.parse(event.data) as TranscriptMessage;
            const transcript = message.transcript;
            const originalText = transcript.words
                .map((word) => word.text)
                .join(" ");

            const translationLines = getTranslationLines();
            const languages = translationLines.map((t) => t.language);
            const transcriptId = transcript.original_transcript_id;
            const sortKey = getTranscriptSortKey(transcriptId);

            if (!transcript.is_final) {
                const utteranceId = `${transcriptId}-current`;
                // Show original text only — no translation for partials
                setCurrentUtterances((prev) => {
                    const updated = new Map(prev);
                    updated.set(transcriptId, {
                        id: utteranceId,
                        speaker: transcript.speaker,
                        original: originalText,
                        translations: [],
                        sortKey,
                    });
                    return updated;
                });
            } else {
                // Remove from partials
                setCurrentUtterances((prev) => {
                    if (!prev.has(transcriptId)) return prev;
                    const updated = new Map(prev);
                    updated.delete(transcriptId);
                    return updated;
                });

                const utteranceId = `${transcriptId}-final`;

                // Check if this transcript ID was already finalized (re-final).
                // If so, update the existing entry in place — don't add a duplicate.
                if (finalizedIdsRef.current.has(transcriptId)) {
                    setFinalizedUtterances((prev) =>
                        prev.map((item) =>
                            item.id === utteranceId
                                ? {
                                      ...item,
                                      original: originalText,
                                      translations: translationLines,
                                  }
                                : item
                        )
                    );

                    // Re-schedule translation for the updated text
                    scheduleTranslation(utteranceId, languages);
                    return;
                }

                const now = Date.now();
                const lastFinal = lastFinalRef.current;

                // Check if we should coalesce with the previous final utterance
                const shouldCoalesce =
                    lastFinal &&
                    lastFinal.speaker === transcript.speaker &&
                    now - lastFinal.timestamp < COALESCE_WINDOW_MS;

                if (shouldCoalesce && lastFinal) {
                    // Append text to the existing utterance instead of creating a new one
                    const existingUtteranceId = lastFinal.utteranceId;

                    setFinalizedUtterances((prev) =>
                        prev.map((item) =>
                            item.id === existingUtteranceId
                                ? {
                                      ...item,
                                      original:
                                          item.original + " " + originalText,
                                  }
                                : item
                        )
                    );

                    // Update timestamp so further rapid finals keep coalescing
                    lastFinal.timestamp = now;

                    // Track this transcript ID as finalized
                    finalizedIdsRef.current.add(transcriptId);

                    // Re-schedule translation (debounced) for the coalesced utterance
                    scheduleTranslation(existingUtteranceId, languages);
                } else {
                    // Create a new finalized utterance

                    setFinalizedUtterances((prev) =>
                        [
                            {
                                id: utteranceId,
                                speaker: transcript.speaker,
                                original: originalText,
                                translations: translationLines,
                                sortKey,
                            },
                            ...prev,
                        ].slice(0, MAX_UTTERANCES)
                    );

                    // Track this transcript ID as finalized
                    finalizedIdsRef.current.add(transcriptId);

                    // Track this as the last final for coalescing
                    lastFinalRef.current = {
                        speaker: transcript.speaker,
                        utteranceId,
                        sortKey,
                        timestamp: now,
                    };

                    // Schedule translation (debounced in case more words arrive quickly)
                    scheduleTranslation(utteranceId, languages);
                }
            }
        };

        const attemptReconnect = () => {
            if (!retryIntervalRef.current) {
                retryIntervalRef.current = window.setInterval(() => {
                    console.log("Attempting to reconnect to WebSocket...");
                    connectWebSocket();
                }, RECONNECT_RETRY_INTERVAL_MS);
            }
        };

        const connectWebSocket = () => {
            if (wsRef.current) return;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log("Connected to WebSocket server");
                if (retryIntervalRef.current) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                }
            };

            wsRef.current.onmessage = handleTranscriptMessage;

            wsRef.current.onclose = () => {
                console.log("WebSocket closed. Attempting to reconnect...");
                wsRef.current = null;
                attemptReconnect();
            };

            wsRef.current.onerror = (error: Event) => {
                console.error("WebSocket error:", error);
                wsRef.current?.close();
            };
        };

        connectWebSocket();

        // Auto-clear all utterances every minute
        const clearIntervalId = setInterval(() => {
            setFinalizedUtterances([]);
            setCurrentUtterances(new Map());
            // Also reset sort key tracking so IDs don't collide with stale entries
            transcriptOrderRef.current.clear();
            nextTranscriptOrderRef.current = 0;
            lastFinalRef.current = null;
            finalizedIdsRef.current.clear();
        }, CLEAR_INTERVAL_MS);

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
            if (coalesceTimerRef.current) {
                clearTimeout(coalesceTimerRef.current);
                coalesceTimerRef.current = null;
            }
            clearInterval(clearIntervalId);
        };
    }, [wsUrl]);

    const utterances = useMemo(() => {
        const partials = Array.from(currentUtterances.values());
        const allUtterances = [...partials, ...finalizedUtterances];

        return allUtterances.sort((a, b) => b.sortKey - a.sortKey);
    }, [finalizedUtterances, currentUtterances]);

    const translationLegend = getTranslationLines();

    return {
        utterances,
        translationLegend,
    };
};

