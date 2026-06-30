import React, { useEffect, useRef } from "react";
import { useTranscriptWebSocket } from "@/hooks/useTranscriptWebSocket";
import "./Transcript.css";

const Transcript: React.FC = () => {
  const { utterances, translationLegend } = useTranscriptWebSocket(
    "wss://meeting-data.bot.recall.ai/api/v1/transcript"
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Always scroll to top on any utterance change.
  // Triple-guarantee: immediate, requestAnimationFrame, and setTimeout
  // to handle all browser timing edge cases.
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

  return (
    <div className="transcript-wrapper">
      <div className="transcript-container" ref={containerRef}>
        {!utterances.length ? (
          <div className="waiting-message">
            Start speaking to translate in real-time.
          </div>
        ) : null}

        {utterances.map((item, index) => (
          <div key={item.id || index} className="transcript-item">
            {item.speaker ? (
              <div className="speaker-name">{item.speaker}</div>
            ) : null}

            <div className="transcript-columns">
              <div className="original-column">
                <div className="original-text">{item.original}</div>
              </div>

              <div className="translations-column">
                {item.translations.map((translation) => (
                  <div key={translation.language} className="translation-line">
                    <span
                      className="translation-label"
                      style={{ color: translation.color }}
                    >
                      {translation.label}:
                    </span>{" "}
                    <span className="translation-text">
                      {translation.text || "(Translating...)"}
                    </span>
                  </div>
                ))}
              </div>
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
