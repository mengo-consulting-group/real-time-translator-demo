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

        // Debounce timers for partial translations keyed by transcriptId
        const partialTimers = new Map<number, ReturnType<typeof setTimeout>>();

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

        const translateFinalUtterance = async (
            utteranceId: string,
            originalText: string,
            languages: LanguageCode[]
        ) => {
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

        const translatePartialUtterance = async (
            transcriptId: number,
            utteranceId: string,
            originalText: string,
            languages: LanguageCode[]
        ) => {
            await Promise.all(
                languages.map(async (language) => {
                    const translated = await translateText(
                        originalText,
                        language
                    );

                    // Only update if this partial is still current
                    // (not replaced by a newer partial or finalized)
                    setCurrentUtterances((prev) => {
                        const existing = prev.get(transcriptId);
                        if (
                            !existing ||
                            existing.id !== utteranceId ||
                            existing.original !== originalText
                        ) {
                            return prev;
                        }

                        const updated = new Map(prev);
                        updated.set(transcriptId, {
                            ...existing,
                            translations: existing.translations.map((t) =>
                                t.language === language
                                    ? { ...t, text: translated }
                                    : t
                            ),
                        });
                        return updated;
                    });
                })
            );
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
            const utteranceId = `${transcriptId}-${
                transcript.is_final ? "final" : "current"
            }`;
            const sortKey = getTranscriptSortKey(transcriptId);

            if (!transcript.is_final) {
                // Show original text with translation placeholders
                setCurrentUtterances((prev) => {
                    const existing = prev.get(transcriptId);
                    const updated = new Map(prev);
                    updated.set(transcriptId, {
                        id: utteranceId,
                        speaker: transcript.speaker,
                        original: originalText,
                        // Keep existing translations if we have them,
                        // otherwise start with empty lines
                        translations: existing?.translations.length
                            ? existing.translations
                            : translationLines,
                        sortKey,
                    });
                    return updated;
                });

                // Debounce partial translation — wait 500ms of no changes
                const existingTimer = partialTimers.get(transcriptId);
                if (existingTimer) clearTimeout(existingTimer);

                partialTimers.set(
                    transcriptId,
                    setTimeout(() => {
                        partialTimers.delete(transcriptId);
                        translatePartialUtterance(
                            transcriptId,
                            utteranceId,
                            originalText,
                            languages
                        );
                    }, 500)
                );
            } else {
                // Cancel any pending partial translation
                const pendingTimer = partialTimers.get(transcriptId);
                if (pendingTimer) {
                    clearTimeout(pendingTimer);
                    partialTimers.delete(transcriptId);
                }

                // Immediately move from partial to finalized
                setCurrentUtterances((prev) => {
                    if (!prev.has(transcriptId)) return prev;
                    const updated = new Map(prev);
                    updated.delete(transcriptId);
                    return updated;
                });
                setFinalizedUtterances((prev) => [
                    {
                        id: utteranceId,
                        speaker: transcript.speaker,
                        original: originalText,
                        translations: translationLines,
                        sortKey,
                    },
                    ...prev,
                ]);

                // Queue the translation so they process one at a time
                finalQueue.push(async () => {
                    await translateFinalUtterance(
                        utteranceId,
                        originalText,
                        languages
                    );
                });

                processQueue();
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

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
            partialTimers.forEach((timer) => clearTimeout(timer));
            partialTimers.clear();
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
