import { useState, useCallback, useRef } from "react";
import type { Book } from "../data/books";
import ShapeSVG from "./ShapeSVG";

function emojiToTwemoji(emoji: string): string {
  const codepoints = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints.join("-")}.svg`;
}

interface Props {
  book: Book;
  onBack: () => void;
}

let childVoice: SpeechSynthesisVoice | null = null;

function loadVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  childVoice = voices.find((v) => /samantha|karen|moira|tessa/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /female|girl|child/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /en-US|en-GB|en-AU/i.test(v.lang))
    || null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoice;
  loadVoice();
}

function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.7;
    utter.pitch = 1.4;
    utter.lang = "en-US";
    if (childVoice) utter.voice = childVoice;
    window.speechSynthesis.speak(utter);
  }
}

export default function BookReader({ book, onBack }: Props) {
  const [page, setPage] = useState(0);
  const current = book.pages[page];
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(book.pages.length - 1, p + 1)),
    [book.pages.length]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!touchStart.current) return;
      const dx = e.clientX - touchStart.current.x;
      const dy = e.clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      }
    },
    [next, prev]
  );

  const handleSpeak = useCallback(() => {
    if (current.type === "summary" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      if (synth.speaking && !synth.paused) {
        synth.pause();
        return;
      }
      if (synth.paused) {
        synth.resume();
        return;
      }
    }
    const text = current.speech || `${current.title}. ${current.subtitle || ""}`;
    speak(text);
  }, [current]);

  const isNumbers = book.id === "numbers";
  const isAbc = book.id === "abc";
  const isShapes = book.id === "shapes";
  const isPictureBook = !isNumbers && !isAbc && !isShapes;

  return (
    <div
      className="reader"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="reader-header">
        <button className="back-btn" onPointerDown={onBack}>
          ← Back
        </button>
        <span className="page-counter">
          {page + 1} / {book.pages.length}
        </span>
        {book.pages.some((p) => p.type === "summary") && (
          <button className="back-btn" onPointerDown={() => {
            const idx = book.pages.findIndex((p) => p.type === "summary");
            if (idx >= 0) setPage(idx);
          }}>
            Aa
          </button>
        )}
      </div>

      <div className="page-area" style={{ background: current.bg }} key={page}>
        {current.type === "summary" ? (
          <div className="summary-layout">
            <div className="summary-grid">
              {current.summaryItems?.map((item, i) => (
                <span key={i} className="summary-item" onClick={() => speak(/^[a-zA-Z]$/.test(item) ? `${item.toUpperCase()}. ` : item)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>{item}</span>
              ))}
            </div>
          </div>
        ) : isShapes ? (
          <div className="shape-layout">
            <div className="shape-row">
              <ShapeSVG name={current.title} />
              <img className="shape-example" src={emojiToTwemoji(current.emoji)} alt={current.title} />
            </div>
            <div
              className="page-title"
              style={current.letterColor ? { color: current.letterColor } : undefined}
            >
              {current.title}
            </div>
            {current.subtitle && (
              <div className="page-subtitle shape-subtitle">{current.subtitle}</div>
            )}
          </div>
        ) : isNumbers ? (
          <div className="number-layout">
            <div className="number-objects">
              {Array.from({ length: parseInt(current.title) || 1 }, (_, i) => (
                <img key={i} className={`number-object number-obj-count-${Math.min(parseInt(current.title) || 1, 10)}`} src={emojiToTwemoji(current.emoji)} alt="" />
              ))}
            </div>
            <div
              className="number-digit"
              style={current.letterColor ? { color: current.letterColor } : undefined}
            >
              {current.title}
            </div>
            <div className="number-word">{current.subtitle}</div>
          </div>
        ) : (
          <>
            <img className="page-img" src={current.img || emojiToTwemoji(current.emoji)} alt={current.subtitle || current.title} />
            <div className="page-text">
              {isAbc ? (
                <div
                  className="page-title abc-title"
                  style={current.letterColor ? { color: current.letterColor } : undefined}
                >
                  <span>{current.title[0]}</span>
                  <span className="abc-lower">{current.title[1]}</span>
                </div>
              ) : (
                <div
                  className="page-title"
                  style={current.letterColor ? { color: current.letterColor } : undefined}
                >
                  {current.title}
                </div>
              )}
              {current.subtitle && (
                <div className={`page-subtitle ${isPictureBook ? "page-subtitle-big" : ""}`}>{current.subtitle}</div>
              )}
            </div>
          </>
        )}
        <button className="speak-btn" onClick={handleSpeak} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          🔊
        </button>
      </div>

      <div className="reader-nav">
        <div className="page-dots">
          {book.pages.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === page ? "dot-active" : ""}`}
              onPointerDown={() => setPage(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
