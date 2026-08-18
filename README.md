# SafeRoute AI - Proactive Road Safety System

SafeRoute AI is an intelligent, real-time road safety application designed to predict accident-prone zones and alert drivers before they enter high-risk areas. Using sub-meter GPS tracking, multi-modal alerts, and AI-powered risk analysis, SafeRoute AI provides a proactive layer of safety for modern navigation.

---

## 🤖 Core Purpose
Traditional navigation apps tell you *where* to go. SafeRoute AI tells you *how to stay safe*. It identifies "Black Spots" (statistically high-accident areas) and uses distance-detection algorithms to trigger warnings 300–400 meters before a hazard is reached.

---

## 🚀 Technology Stack

### 🎨 Frontend (UI/UX)
*   **Next.js 15 (App Router)**: The architectural foundation, utilizing Server Components for performance and Client Components for real-time interactivity.
*   **React 19**: The core library for building the reactive dashboard and map interface.
*   **Tailwind CSS**: A utility-first CSS framework used for responsive, mobile-first styling and smooth animations.
*   **ShadCN UI**: High-quality, accessible UI components (Cards, Buttons, Toasts) built on Radix UI primitives.
*   **Leaflet.js & React-Leaflet**: An open-source mapping engine used to render geographical risk zones and user movement without external API dependencies.
*   **Lucide React**: Vector icons for intuitive safety signaling.

### ☁️ Backend & Data (Firebase)
*   **Firebase Authentication**: Supports both Anonymous sign-in (for instant use) and Password-based accounts for persistent settings.
*   **Cloud Firestore**: A NoSQL document database organized into three primary collections:
    *   `/users/{userId}/preferences`: Stores personal alert thresholds, voice toggles, and haptic settings.
    *   `/users/{userId}/alertLogs`: A historical record of every risk encounter for user review.
    *   `/riskZones`: A global, read-only collection of coordinates and hazard descriptions.
*   **Firestore Security Rules**: Implements a robust user-ownership model, ensuring private data is segregated while safety coordinates remain publicly accessible.

### 🧠 Artificial Intelligence (Genkit)
*   **Genkit**: An AI orchestration framework used to manage prompts and LLM flows.
*   **Gemini 2.5 Flash**: A high-speed, lightweight Large Language Model (LLM) used to generate **Contextual Risk Warnings**. Instead of generic "Danger" signs, the AI analyzes hazard types (e.g., "Sharp Curve") and descriptions to provide specific, actionable advice (e.g., "Slow down to 25mph, visibility is low ahead").

### 📡 Hardware & Browser Integration
*   **Geolocation API (`watchPosition`)**: Continuously monitors high-accuracy coordinates to update the user marker and calculate proximity to risk zones every second.
*   **Web Speech API (`speechSynthesis`)**: Provides "Eyes on the Road" safety by announcing hazards via high-quality text-to-speech.
*   **Vibration API (`navigator.vibrate`)**: Delivers haptic feedback patterns (pulses) on mobile devices to alert drivers even in noisy environments.

---

## 🚦 Safety Logic
1.  **Tracking**: The app monitors latitude/longitude using the device's GPS hardware.
2.  **Detection**: A Haversine formula calculates the distance between the user and all marked `RiskZone` entities.
3.  **Trigger**: If the user is within **400 meters** AND the zone's **Severity is ≥ 8**, a multi-modal alert is fired.
4.  **Multi-Modal Alert**:
    *   **Visual**: A high-visibility Red/Amber banner appears at the top.
    *   **Auditory**: The AI-generated warning is spoken aloud.
    *   **Haptic**: The device vibrates in a distinct safety pattern.

---

## 🛠 Project Structure
*   `src/app/page.tsx`: The primary dashboard containing real-time safety logic.
*   `src/components/SafeMap.tsx`: An SSR-safe interactive map component.
*   `src/ai/flows/`: Genkit server actions for intelligent warning generation.
*   `docs/backend.json`: The authoritative blueprint for the Firestore data model.
*   `src/lib/risk-zones.ts`: Pre-defined high-risk coordinates for the San Francisco demo.

---

## 🏁 Getting Started
1.  **Environment Variables**: Ensure `GEMINI_API_KEY` is set in your `.env`.
2.  **Install Dependencies**: `npm install`
3.  **Development Mode**: `npm run dev`
4.  **Genkit UI**: `npm run genkit:dev` to test AI prompt logic.

---

## 🧪 Testing the Demo
To test the alerts without leaving your desk:
1.  Open **Chrome DevTools** (F12).
2.  Go to **Sensors** (in the "More Tools" menu).
3.  Override **Location** with a "High Risk" coordinate: `37.7749, -122.4194`.
4.  The map will update, and you will hear the safety warning instantly.
