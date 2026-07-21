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
  // Holds the latest non-final phrase, committed on pause if no final arrives.
  const interimRef = useRef("");
  // How many final results in the current session have already been written
  // (results accumulate in continuous mode, so we only append new ones).
  const committedRef = useRef(0);

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
    rec.interimResults = true;
    interimRef.current = "";
    committedRef.current = 0;
    rec.onresult = (e) => {
      let newFinal = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r || !r[0]) continue;
        if (r.isFinal) {
          // Only append finals we haven't written yet (list accumulates).
          if (i >= committedRef.current) {
            newFinal += r[0].transcript + " ";
            committedRef.current = i + 1;
          }
        } else {
          interim += r[0].transcript + " ";
        }
      }
      if (newFinal.trim()) {
        onText(newFinal.trim());
        interimRef.current = "";
      } else {
        interimRef.current = interim;
      }
    };
    rec.onend = () => {
      // If a phrase was in progress but never finalized, commit it now.
      if (interimRef.current.trim()) {
        onText(interimRef.current.trim());
        interimRef.current = "";
      }
      // Browser stopped (usually after a pause) — start a FRESH recognizer if
      // still wanted (reusing the old one stops emitting results on some browsers).
      if (wantRef.current) {
        setTimeout(() => {
          if (wantRef.current) begin();
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
