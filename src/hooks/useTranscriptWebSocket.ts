import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageCode, languageNameMap } from "@/utils/language";
import { translateText } from "@/utils/translate";
import { detectLanguageChangeCommand } from "@/utils/language";

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
    color?: string;
}

    const RECONNECT_RETRY_INTERVAL_MS = 3000;

const BASE_TRANSLATION_LANGUAGES: TranslationLine[] = [
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

const getTranslationLines = (
    optionalLanguage?: LanguageCode
): TranslationLine[] => {
    const baseLanguages = BASE_TRANSLATION_LANGUAGES.map((translation) => ({
        ...translation,
    }));

    if (
        optionalLanguage &&
        optionalLanguage !== LanguageCode.English &&
        optionalLanguage !== LanguageCode.Spanish
    ) {
        baseLanguages.push({
            language: optionalLanguage,
            label: languageNameMap[optionalLanguage],
            text: "",
            color: "#c084fc",
        });
    }

    return baseLanguages;
};

export const useTranscriptWebSocket = (wsUrl: string) => {
    const optionalLanguageRef = useRef<LanguageCode | undefined>(undefined);
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
    const [optionalLanguage, setOptionalLanguage] = useState<
        LanguageCode | undefined
    >(undefined);

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
                            // Ignore stale translations from older partial transcript messages.
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

            // Only detect language change commands on final transcripts
            // to avoid false positives from partial/incomplete phrases.
            if (transcript.is_final) {
                const newLanguage =
                    detectLanguageChangeCommand(originalText);
                if (newLanguage) {
                    const shouldUseOptionalLanguage =
                        newLanguage !== LanguageCode.English &&
                        newLanguage !== LanguageCode.Spanish;

                    optionalLanguageRef.current = shouldUseOptionalLanguage
                        ? newLanguage
                        : undefined;
                    setOptionalLanguage(
                        shouldUseOptionalLanguage ? newLanguage : undefined
                    );
                    setCurrentUtterance(null);
                    setFinalizedUtterances([]);

                return;
                }
            }

            const translationLines = getTranslationLines(
                optionalLanguageRef.current
            );
            const languages = translationLines.map(
                (translation) => translation.language
            );
            const utteranceId = `${transcript.original_transcript_id}-${
                transcript.is_final ? "final" : "current"
            }`;
            const sortKey = getTranscriptSortKey(
                transcript.original_transcript_id
            );

            // Show the transcript immediately before waiting for translation.
            // The UI displays "(Translating...)" while each translation is empty.
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

    // This could get super long for really long conversations.
    // Consider limiting the number of utterances stored.
    const utterances = useMemo(() => {
        const allUtterances = currentUtterance
            ? [currentUtterance, ...finalizedUtterances]
            : finalizedUtterances;

        return [...allUtterances].sort((a, b) => b.sortKey - a.sortKey);
    }, [finalizedUtterances, currentUtterance]);

    const translationLegend = useMemo(
        () => getTranslationLines(optionalLanguage),
        [optionalLanguage]
    );

    return {
        utterances,
        translationLegend,
    };
};
