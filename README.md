# SafeRoute AI - Intelligent Road Safety

SafeRoute AI is a proactive hazard detection and navigation safety application built with Next.js and integrated with real-time browser hardware APIs.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Mapping**: [Leaflet.js](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🤖 AI & Backend

- **AI Orchestration**: [Genkit](https://github.com/firebase/genkit)
- **LLM**: [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini) (via `@genkit-ai/google-genai`)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore, Auth)

## 📡 Hardware & Browser APIs

- **Real-time Tracking**: [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) (`watchPosition`)
- **Voice Guidance**: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`speechSynthesis`)
- **Haptic Feedback**: [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) (`navigator.vibrate`)

## 🛠 Getting Started

1. **Environment Variables**: Ensure `GEMINI_API_KEY` is set for AI features.
2. **Installation**: `npm install`
3. **Development**: `npm run dev`
4. **Genkit UI**: `npm run genkit:dev`

## 🚦 Testing the App

To test the proximity alerts without physical movement:
1. Open **Chrome DevTools** (F12).
2. Go to **Sensors** (under More Tools).
3. Override **Location** with coordinates near a risk zone (e.g., `37.7749, -122.4194`).
