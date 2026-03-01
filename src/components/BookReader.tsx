import { useState, useCallback, useRef, useEffect } from "react";
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
  childVoice = voices.find((v) => /samantha/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /karen|moira|tessa/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /child|kid|girl/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /female/i.test(v.name) && /en/i.test(v.lang))
    || voices.find((v) => /en-US|en-GB|en-AU/i.test(v.lang))
    || null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoice;
  loadVoice();
}

let speechVolume = 1;

function speak(text: string, rate = 0.55) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const parts = text.split("...").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1.3;
    utter.volume = speechVolume;
    utter.lang = "en-US";
    if (childVoice) utter.voice = childVoice;
    window.speechSynthesis.speak(utter);
    return;
  }

  let i = 0;
  function speakNext() {
    if (i >= parts.length) return;
    const utter = new SpeechSynthesisUtterance(parts[i]);
    utter.rate = rate;
    utter.pitch = 1.3;
    utter.volume = speechVolume;
    utter.lang = "en-US";
    if (childVoice) utter.voice = childVoice;
    utter.onend = () => {
      i++;
      if (i < parts.length) {
        setTimeout(speakNext, 300);
      }
    };
    window.speechSynthesis.speak(utter);
  }
  speakNext();
}

const stopEvent = (e: React.PointerEvent | React.MouseEvent) => { e.stopPropagation(); };

const SWIPE_THRESHOLD_PX = 20;
const SWIPE_RATIO = 0.6;

const NUMBER_COLORS = [
  "#E53935", "#F9A825", "#2E7D32", "#1565C0", "#7B1FA2",
  "#EF6C00", "#00ACC1", "#E91E63", "#8D6E63", "#5C6BC0",
];

const ABC_COLORS = [
  "#E53935", "#EF6C00", "#F9A825", "#2E7D32", "#1565C0",
  "#7B1FA2", "#00ACC1", "#E91E63", "#8D6E63", "#0288D1",
  "#E65100", "#558B2F", "#5C6BC0", "#AD1457", "#FF8F00",
  "#00897B", "#6D4C41", "#C62828", "#F57F17", "#1B5E20",
  "#283593", "#6A1B9A", "#00838F", "#D84315", "#827717",
  "#37474F",
];

export default function BookReader({ book, onBack }: Props) {
  const [page, setPage] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [volume] = useState(1);
  const [showPagePicker, setShowPagePicker] = useState(false);
  const current = book.pages[page];
  const touchStart = useRef<{ x: number; y: number; pointerId: number; time: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFailed = useRef(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const interval = setInterval(() => {
      const audioPlaying = audioRef.current ? !audioRef.current.paused && !audioRef.current.ended : false;
      setSpeaking((synth.speaking && !synth.paused) || audioPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    audioFailed.current = false;
  }, [page]);

  useEffect(() => {
    speechVolume = volume;
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(book.pages.length - 1, p + 1)),
    [book.pages.length]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Always accept a new pointer -- baby may be holding phone with other fingers
    touchStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, time: Date.now() };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!touchStart.current || e.pointerId !== touchStart.current.pointerId) return;
      const dx = e.clientX - touchStart.current.x;
      const dy = e.clientY - touchStart.current.y;
      const elapsed = Date.now() - touchStart.current.time;
      touchStart.current = null;

      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) {
        if (dx < 0) next();
        else prev();
        return;
      }

      if (elapsed < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const screenWidth = window.innerWidth;
        const tapX = e.clientX;
        if (tapX < screenWidth * 0.15) {
          prev();
        } else if (tapX > screenWidth * 0.85) {
          next();
        }
      }
    },
    [next, prev]
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (touchStart.current && e.pointerId === touchStart.current.pointerId) {
      touchStart.current = null;
    }
  }, []);

  const handleSpeak = useCallback(() => {
    if (audioRef.current) {
      if (!audioRef.current.paused && !audioRef.current.ended) {
        audioRef.current.pause();
        return;
      }
      if (audioRef.current.paused && audioRef.current.currentTime > 0) {
        audioRef.current.play();
        return;
      }
    }

    if (current.audio && !audioFailed.current) {
      window.speechSynthesis?.cancel();
      const audio = new Audio(current.audio);
      audio.volume = volume;
      audio.oncanplaythrough = () => {
        audio.play();
        audioRef.current = audio;
        audio.onended = () => { audioRef.current = null; };
      };
      audio.onerror = () => {
        audioRef.current = null;
        audioFailed.current = true;
        const text = current.speech || `${current.title}. ${current.subtitle || ""}`;
        speak(text, current.type === "summary" ? 0.4 : 0.55);
      };
      audio.load();
      return;
    }

    if ("speechSynthesis" in window) {
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
    speak(text, current.type === "summary" ? 0.4 : 0.55);
  }, [current, volume]);

  const isNumbers = book.id === "numbers";
  const isAbc = book.id === "abc";
  const isShapes = book.id === "shapes";
  const isPictureBook = !isNumbers && !isAbc && !isShapes;

  const [highlightIdx, setHighlightIdx] = useState(-1);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setHighlightIdx(-1);
    highlightTimer.current.forEach(clearTimeout);
    highlightTimer.current = [];
  }, [page]);

  const countObjects = useCallback((count: number) => {
    highlightTimer.current.forEach(clearTimeout);
    highlightTimer.current = [];
    const speechText = current.speech || "";
    const countStart = speechText.lastIndexOf("...");
    const preCount = countStart > 0 ? speechText.slice(0, countStart).trim() : speechText;
    speak(preCount);
    const preDelay = Math.max(preCount.length * 70, 2500);
    for (let i = 0; i < count; i++) {
      const delay = preDelay + i * 1200;
      highlightTimer.current.push(setTimeout(() => {
        setHighlightIdx(i);
        speak(`${i + 1}`);
      }, delay));
    }
    highlightTimer.current.push(setTimeout(() => {
      setHighlightIdx(-1);
    }, preDelay + count * 1200 + 600));
  }, [current]);

  const tapSpeak = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (isNumbers && current.type !== "summary") {
      const count = parseInt(current.title) || 1;
      if (count > 1) {
        countObjects(count);
        return;
      }
    }
    const text = current.speech || `${current.title}. ${current.subtitle || ""}`;
    speak(text);
  }, [current, isNumbers, countObjects]);

  return (
    <div
      className="reader"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="reader-header" onPointerDown={stopEvent}>
        <button className="back-btn" onPointerUp={(e) => { e.stopPropagation(); onBack(); }}>
          &#8592; Back
        </button>
        {book.pages.some((p) => p.type === "summary") && (
          <button className="back-btn" onPointerUp={(e) => {
            e.stopPropagation();
            const idx = book.pages.findIndex((p) => p.type === "summary");
            if (idx >= 0) setPage(idx);
          }}>
            {isNumbers ? "123" : "Aa"}
          </button>
        )}
      </div>

      <div className={`page-area ${isAbc && current.type !== "summary" ? "abc-layout" : ""}`} style={{ background: current.bg }} key={page}>
        {current.type === "summary" ? (
          <div className="summary-layout">
            <div className={`summary-grid ${isNumbers ? "summary-grid-numbers" : ""} ${isAbc ? "summary-grid-abc" : ""}`}>
              {current.summaryItems?.map((item, i) => (
                <span key={i} className={`summary-item ${isNumbers ? "summary-item-number" : ""} ${isAbc ? "summary-item-abc" : ""}`} style={isNumbers ? { color: NUMBER_COLORS[i % NUMBER_COLORS.length] } : isAbc ? { color: ABC_COLORS[i % ABC_COLORS.length] } : undefined} onPointerDown={stopEvent} onPointerUp={(e) => { e.stopPropagation(); speak(/^[a-zA-Z]$/.test(item) ? `${item.toUpperCase()}. ` : item); }}>{item}</span>
              ))}
            </div>
          </div>
        ) : isShapes ? (
          <div className="shape-layout">
            <div className="shape-row" onPointerDown={stopEvent} onPointerUp={tapSpeak}>
              <ShapeSVG name={current.title} />
              <img className="shape-example" src={emojiToTwemoji(current.emoji)} alt={current.title} />
            </div>
            <div
              className="page-title tappable"
              style={current.letterColor ? { color: current.letterColor } : undefined}
              onPointerDown={stopEvent} onPointerUp={tapSpeak}
            >
              {current.title}
            </div>
            {current.subtitle && (
              <div className="page-subtitle shape-subtitle">{current.subtitle}</div>
            )}
          </div>
        ) : isNumbers ? (
          <div className="number-layout">
            <div className="number-objects" onPointerDown={stopEvent} onPointerUp={tapSpeak}>
              {current.emojis ? current.emojis.map((em, i) => (
                <img key={i} className={`number-object number-obj-count-${Math.min(current.emojis!.length, 10)} ${highlightIdx === i ? "number-object-highlight" : ""}`} src={emojiToTwemoji(em)} alt="" />
              )) : Array.from({ length: parseInt(current.title) || 1 }, (_, i) => (
                <img key={i} className={`number-object number-obj-count-${Math.min(parseInt(current.title) || 1, 10)} ${highlightIdx === i ? "number-object-highlight" : ""}`} src={emojiToTwemoji(current.emoji)} alt="" />
              ))}
            </div>
            <div
              className="number-digit tappable"
              style={current.letterColor ? { color: current.letterColor } : undefined}
              onPointerDown={stopEvent} onPointerUp={tapSpeak}
            >
              {current.title}
            </div>
            <div className="number-word" style={current.letterColor ? { color: current.letterColor } : undefined}>{current.subtitle}</div>
          </div>
        ) : (
          <>
            <img className={`page-img tappable ${isAbc ? "page-img-abc" : ""}`} src={current.img || emojiToTwemoji(current.emoji)} alt={current.subtitle || current.title} onPointerDown={stopEvent} onPointerUp={tapSpeak} />
            <div className="page-text">
              {isAbc ? (
                <div
                  className="page-title abc-title tappable"
                  style={current.letterColor ? { color: current.letterColor } : undefined}
                  onPointerDown={stopEvent} onPointerUp={tapSpeak}
                >
                  <span>{current.title[0]}</span>
                  <span className="abc-lower">{current.title[1]}</span>
                </div>
              ) : (
                <div
                  className="page-title tappable"
                  style={current.letterColor ? { color: current.letterColor } : undefined}
                  onPointerDown={stopEvent} onPointerUp={tapSpeak}
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
        <div className="speak-controls" onPointerDown={stopEvent} onPointerUp={stopEvent}>
          <button
            className="speak-btn"
            onPointerUp={(e) => { e.stopPropagation(); handleSpeak(); }}
          >
            {speaking ? "\u23F8\uFE0F" : "\uD83D\uDD0A"}
          </button>
        </div>
      </div>

      <div className="reader-nav" onPointerDown={stopEvent}>
        <button
          className="nav-btn"
          onPointerUp={(e) => { e.stopPropagation(); prev(); }}
          disabled={page === 0}
        >
          &#9664;
        </button>
        <button
          className="nav-page-indicator"
          onPointerUp={(e) => { e.stopPropagation(); setShowPagePicker((v) => !v); }}
        >
          {page + 1} / {book.pages.length}
        </button>
        <button
          className="nav-btn"
          onPointerUp={(e) => { e.stopPropagation(); next(); }}
          disabled={page === book.pages.length - 1}
        >
          &#9654;
        </button>
      </div>

      {showPagePicker && (
        <div className="page-picker-overlay" onPointerDown={stopEvent}>
          <div className="page-picker">
            {book.pages.map((_, i) => (
              <button
                key={i}
                className={`page-picker-item ${i === page ? "page-picker-active" : ""}`}
                onPointerUp={(e) => { e.stopPropagation(); setPage(i); setShowPagePicker(false); }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button className="page-picker-close" onPointerUp={(e) => { e.stopPropagation(); setShowPagePicker(false); }}>Close</button>
        </div>
      )}
    </div>
  );
}
