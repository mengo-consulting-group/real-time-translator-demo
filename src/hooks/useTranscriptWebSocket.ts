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
    const [currentUtterance, setCurrentUtterance] = useState<Utterance | null>(
        null
    );

    useEffect(() => {
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

        const translateUtterance = async (
            utteranceId: string,
            originalText: string,
            isFinal: boolean,
            languages: LanguageCode[]
        ) => {
            await Promise.all(
                languages.map(async (language) => {
                    const translated = await translateText(
                        originalText,
                        language
                    );

                    if (!isFinal) {
                        setCurrentUtterance((prev) => {
                            if (
                                !prev ||
                                prev.id !== utteranceId ||
                                prev.original !== originalText
                            ) {
                                return prev;
                            }

                            return {
                                ...prev,
                                translations: prev.translations.map(
                                    (translation) =>
                                        translation.language === language
                                            ? {
                                                  ...translation,
                                                  text: translated,
                                              }
                                            : translation
                                ),
                            };
                        });
                        return;
                    }

                    updateFinalizedUtteranceTranslation(
                        utteranceId,
                        language,
                        translated
                    );
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
            const utteranceId = `${transcript.original_transcript_id}-${
                transcript.is_final ? "final" : "current"
            }`;
            const sortKey = getTranscriptSortKey(
                transcript.original_transcript_id
            );

            if (!transcript.is_final) {
                setCurrentUtterance({
                    id: utteranceId,
                    speaker: transcript.speaker,
                    original: originalText,
                    translations: translationLines,
                    sortKey,
                });
            } else {
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
                setCurrentUtterance(null);
            }

            await translateUtterance(
                utteranceId,
                originalText,
                transcript.is_final,
                languages
            );
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
        };
    }, [wsUrl]);

    const utterances = useMemo(() => {
        const allUtterances = currentUtterance
            ? [currentUtterance, ...finalizedUtterances]
            : finalizedUtterances;

        return [...allUtterances].sort((a, b) => b.sortKey - a.sortKey);
    }, [finalizedUtterances, currentUtterance]);

    const translationLegend = getTranslationLines();

    return {
        utterances,
        translationLegend,
    };
};
