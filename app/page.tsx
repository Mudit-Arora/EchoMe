"use client";

import { useRef, useState } from "react";
import { NAME } from "@/lib/bio";

type Msg = { role: "user" | "assistant"; content: string };
type Status = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError("Microphone access denied. Allow mic permission and try again.");
      setStatus("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function handleStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setStatus("transcribing");

    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const txRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!txRes.ok) throw new Error(`transcription: ${await txRes.text()}`);
      const { text: userText } = await txRes.json();
      if (!userText?.trim()) {
        setStatus("idle");
        return;
      }

      const nextMessages: Msg[] = [...messages, { role: "user", content: userText }];
      setMessages(nextMessages);

      setStatus("thinking");
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!chatRes.ok) throw new Error(`chat: ${await chatRes.text()}`);
      const { text: replyText } = await chatRes.json();
      setMessages([...nextMessages, { role: "assistant", content: replyText }]);

      setStatus("speaking");
      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (!speakRes.ok) throw new Error(`tts: ${await speakRes.text()}`);
      const audioBlob = await speakRes.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setStatus("idle");
      };
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("idle");
    }
  }

  function onTalkClick() {
    if (status === "recording") stopRecording();
    else if (status === "idle") startRecording();
  }

  const statusText = {
    idle: messages.length === 0 ? "Tap the mic to start" : "Tap to ask another",
    recording: "Listening…",
    transcribing: "Transcribing…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  }[status];

  const busy = status === "transcribing" || status === "thinking" || status === "speaking";
  const showBars = status === "thinking" || status === "speaking";

  return (
    <main className="container">
      <header className="hero">
        <h1 className="headline">
          Hi, I'm <em>{NAME}</em>.
        </h1>
        <p className="subtitle">Ask me anything — about my background, a hard problem I've solved, or a project I've built.</p>
      </header>

      <div className="mic-wrap">
        <button
          className={`mic-btn ${status === "recording" ? "recording" : ""}`}
          onClick={onTalkClick}
          disabled={busy}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
        >
          {showBars ? (
            <div className="bars">
              <span /><span /><span /><span /><span />
            </div>
          ) : (
            <MicIcon />
          )}
        </button>
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
      </div>

      <div className="status">{statusText}</div>

      {error && <div className="error">{error}</div>}

      <div className="transcript">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>

      {messages.length === 0 && !error && <div className="hint">Built with Gemini · Cartesia voice</div>}
    </main>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}
