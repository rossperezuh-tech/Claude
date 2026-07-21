"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Free, browser-based voice helpers (Web Speech API) — no server, no API cost.
 * MicButton dictates speech into a text field; SpeakButton reads text aloud.
 * Both render nothing when the browser doesn't support the feature.
 */

// Minimal typings — the Web Speech API isn't in the standard TS dom lib.
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};
type SpeechResultEvent = {
  resultIndex: number;
  results: { isFinal: boolean; 0: { transcript: string } }[];
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function MicButton({
  onText,
  className = "",
}: {
  onText: (text: string) => void;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  // True while the user wants to keep dictating. Browsers end recognition
  // after a pause, so we auto-restart until the user taps Stop.
  const wantRef = useRef(false);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    return () => {
      wantRef.current = false;
      recRef.current?.stop();
    };
  }, []);

  function begin() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text.trim()) onText(text.trim());
    };
    rec.onend = () => {
      // Browser stopped (usually after a pause) — restart if still wanted.
      if (wantRef.current) {
        setTimeout(() => {
          if (wantRef.current) {
            try {
              rec.start();
            } catch {
              /* transient — next onend will retry */
            }
          }
        }, 250);
      } else {
        setListening(false);
        recRef.current = null;
      }
    };
    rec.onerror = (e) => {
      // Permission / hardware errors are fatal; stop for good.
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed" || e?.error === "audio-capture") {
        wantRef.current = false;
        setListening(false);
        recRef.current = null;
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* already starting */
    }
  }

  function toggle() {
    if (wantRef.current) {
      wantRef.current = false;
      recRef.current?.stop();
      setListening(false);
      return;
    }
    wantRef.current = true;
    setListening(true);
    begin();
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop dictation" : "Dictate — speak to fill this field"}
      aria-label="Dictate"
      className={`btn shrink-0 ${
        listening ? "animate-pulse border-red-400/60 text-red-300" : ""
      } ${className}`}
    >
      {listening ? "● Listening…" : "🎤 Speak"}
    </button>
  );
}

export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function toggle() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  if (!supported || !text.trim()) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={speaking ? "Stop" : "Read aloud"}
      aria-label="Read aloud"
      className={`btn shrink-0 text-xs ${
        speaking ? "border-indigo-400/60 text-indigo-300" : ""
      } ${className}`}
    >
      {speaking ? "■ Stop" : "🔊 Read aloud"}
    </button>
  );
}
