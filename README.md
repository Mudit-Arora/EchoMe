# Intro Voice

A voice AI agent that answers questions about you for a company intro round. Built with **Next.js**, **Gemini 2.5 Flash** (LLM), and **Cartesia** for the full voice pipeline (Ink-Whisper STT + Sonic-2 TTS with voice cloning).

## Setup

1. Install deps:
   ```
   npm install
   ```

2. Add API keys to `.env.local`:
   ```
   GEMINI_API_KEY=...
   CARTESIA_API_KEY=...
   CARTESIA_VOICE_ID=...        # ID of your cloned voice from play.cartesia.ai
   ```

3. Edit **`lib/bio.ts`** — replace `NAME` and the three placeholder sections (intro / technical challenge / project deep dive).

4. *(Optional)* Add more sources for the agent to reference:
   - Edit `scripts/sources.json` with URLs (your portfolio, blog, etc.) and run:
     ```
     npm run scrape
     ```
     This writes one `.txt` file per URL into `lib/sources/`.
   - **For LinkedIn**, anonymous scraping is blocked. Copy your profile's visible text and save it manually as `lib/sources/linkedin.txt`.
   - Any `.txt` file in `lib/sources/` is auto-loaded into the agent's context.

5. Run dev server:
   ```
   npm run dev
   ```

6. Open http://localhost:3000, allow mic access, tap to talk.

## How it works

```
browser mic (MediaRecorder)
   │
   ▼
/api/transcribe  →  Cartesia Ink-Whisper  →  text
   │
   ▼
/api/chat        →  Gemini 2.5 Flash  →  reply text
                    (system prompt = bio + lib/sources/*)
   │
   ▼
/api/speak       →  Cartesia Sonic-2 TTS (your cloned voice)  →  mp3
   │
   ▼
audio plays in browser
```

Conversation history is sent with each turn so follow-ups have context.

## Voice cloning

1. Go to https://play.cartesia.ai and clone your voice (upload a ~30s clean recording).
2. Copy the voice ID and put it in `.env.local` as `CARTESIA_VOICE_ID`.

## Customize

- **Response style/length**: edit the `systemPrompt()` function in `app/api/chat/route.ts`
- **TTS model**: change `model_id: "sonic-2"` in `app/api/speak/route.ts`
- **Voice clone**: swap `CARTESIA_VOICE_ID` in `.env.local`
