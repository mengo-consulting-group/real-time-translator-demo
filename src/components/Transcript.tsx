import React, { useEffect, useRef } from "react";
import { useTranscriptWebSocket } from "@/hooks/useTranscriptWebSocket";
import "./Transcript.css";

const Transcript: React.FC = () => {
  const { utterances, translationLegend } = useTranscriptWebSocket(
    "wss://meeting-data.bot.recall.ai/api/v1/transcript"
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevBaseIdsRef = useRef<string>("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const baseIds = utterances
      .map((u) => u.id.replace(/-(current|final)$/, ""))
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .join(",");

    const prevIds = prevBaseIdsRef.current;
    prevBaseIdsRef.current = baseIds;

    // Always snap to top when a new transcript arrives
    if (baseIds !== prevIds) {
      container.scrollTop = 0;
    }
  }, [utterances]);

  let lastSpeaker: string | null = null;

  return (
    <div className="transcript-wrapper">
      <div className="transcript-container" ref={containerRef}>
        {!utterances.length ? (
          <div className="waiting-message">
            Start speaking to translate in real-time.
          </div>
        ) : null}

        {utterances.map((item, index) => {
          const isNewSpeaker = item.speaker !== lastSpeaker;
          lastSpeaker = item.speaker;

          return (
            <div key={item.id || index} className="transcript-item">
              {isNewSpeaker && item.speaker ? (
                <div className="speaker-name">{item.speaker}</div>
              ) : null}

              <div className="original-text">{item.original}</div>

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
          );
        })}
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
