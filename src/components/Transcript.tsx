import React, { useEffect, useRef } from "react";
import { useTranscriptWebSocket } from "@/hooks/useTranscriptWebSocket";
import { LanguageCode } from "@/utils/language";
import "./Transcript.css";

const Transcript: React.FC = () => {
  const { utterances, translationLegend } = useTranscriptWebSocket(
    "wss://meeting-data.bot.recall.ai/api/v1/transcript"
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Always scroll to top on any utterance change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = 0;
    requestAnimationFrame(() => {
      container.scrollTop = 0;
    });
    const timer = setTimeout(() => {
      container.scrollTop = 0;
    }, 50);
    return () => clearTimeout(timer);
  }, [utterances]);

  const getTranslationText = (
    translations: { language: LanguageCode; text: string }[],
    language: LanguageCode
  ): string => {
    const found = translations.find((t) => t.language === language);
    if (!found) return "";
    return found.text || "(Translating...)";
  };

  return (
    <div className="transcript-wrapper">
      {/* Column headers */}
      <div className="transcript-header">
        <div className="transcript-header-cell header-original">Original</div>
        <div className="transcript-header-cell header-english">English</div>
        <div className="transcript-header-cell header-spanish">Spanish</div>
      </div>

      <div className="transcript-container" ref={containerRef}>
        {!utterances.length ? (
          <div className="waiting-message">
            Start speaking to translate in real-time.
          </div>
        ) : null}

        {utterances.map((item, index) => (
          <div key={item.id || index} className="transcript-item">
            <div className="col-original">
              {item.speaker ? (
                <div className="speaker-name">{item.speaker}</div>
              ) : null}
              <div className="original-text">{item.original}</div>
            </div>

            <div className="col-english">
              <span className="translation-text">
                {getTranslationText(item.translations, LanguageCode.English)}
              </span>
            </div>

            <div className="col-spanish">
              <span className="translation-text">
                {getTranslationText(item.translations, LanguageCode.Spanish)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="translation-legend">
        {translationLegend.map((translation) => (
          <div key={translation.language} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: translation.color }}
            />
            <span>{translation.label}</span>
          </div>
        ))}
        <div className="legend-item original-legend">
          <span className="legend-color original-color" />
          <span>Original</span>
        </div>
      </div>
    </div>
  );
};

export default Transcript;
