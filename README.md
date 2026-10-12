# Chat with tools (Project 1)

Streaming chat app built with Next.js and the Vercel AI SDK. The model can call three tools (weather, calculator, time) and the UI shows each call as an expandable card. The model provider is swappable through environment variables, so the same code runs on Groq, Gemini, OpenRouter, or a paid model.

## Setup

These files are the `src/` code only. Create the Next.js shell first, then copy them in.

```bash
# 1. Create the app (accept defaults; choose TypeScript, Tailwind, App Router, src/ directory, "@/*" alias)
npx create-next-app@latest ai-chat
cd ai-chat

# 2. Install dependencies
npm install ai @ai-sdk/react @ai-sdk/openai-compatible zod react-markdown

# 3. Copy these files over the generated ones:
#    src/app/page.tsx
#    src/app/api/chat/route.ts
#    src/components/Chat.tsx
#    src/components/ToolCard.tsx
#    src/lib/model.ts
#    src/lib/tools.ts
#    .env.example

# 4. Add your key
cp .env.example .env.local     # then edit .env.local

# 5. Run
npm run dev                    # http://localhost:3000
```

Get a free key: Groq at https://console.groq.com/keys or Gemini at https://aistudio.google.com/apikey

## Deploy (free)

1. Push to GitHub (make sure `.env.local` is not committed).
2. Import the repo in Vercel, add `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` as environment variables, and deploy.

## If something does not compile

The AI SDK changes between major versions. If a type or import errors, check the current docs at https://ai-sdk.dev (Chatbot and Tool Calling pages) and compare with `Chat.tsx` and `route.ts`. The usual suspects are `useChat` options, message part types, and `stopWhen`.

## Checklist for "done"

- [ ] Streaming works, and Stop cancels a response
- [ ] At least one tool call shows up as a card
- [ ] Error and retry state tested (try a wrong API key)
- [ ] Deployed at a public URL
- [ ] Architecture diagram and screenshots added here
- [ ] Note on cost and limits (free tier; rate limit per IP; max message length)

## Next steps from the roadmap

1. Persist conversations (Supabase or Neon Postgres, or localStorage first).
2. Add one generative-UI tool: return structured JSON and render it as a table or chart component.
3. Cache responses during development to save free-tier quota.
4. Optional: move one tool into a small Python FastAPI service and call it from the route.

## What I would improve

Write this section yourself after building. Good candidates: real rate limiting (Upstash), auth, tool-call approval for risky actions, and basic evals for tool selection.
