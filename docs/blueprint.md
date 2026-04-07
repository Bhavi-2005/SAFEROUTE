# **App Name**: SafeRoute AI

## Core Features:

- GPS Location Tracking: Continuously track the user's real-time geographic location using navigator.geolocation.watchPosition and update it on the map.
- Interactive Map Display: Display an interactive map using Leaflet.js, showing the user's current position with a clear marker.
- Risk Zone Visualization: Render predefined, hardcoded accident-prone zones on the map using color-coded circles (red for high risk, orange for medium risk).
- Client-Side Intelligent Risk Detection: Utilizes an intelligent, rule-based system as a tool to continuously calculate the user's distance to hardcoded risk zones. It proactively identifies and triggers alerts when the user is within a specified danger radius (e.g., 400 meters), integrating factors like proximity for smart hazard assessment entirely within the browser.
- Multi-Modal Alert System: Trigger comprehensive, multi-modal alerts when a risk zone is approached, including a dynamic on-screen warning message (potentially indicating distance remaining), a voice announcement via speechSynthesis (e.g., 'Warning! High risk zone ahead in X meters'), and haptic feedback via navigator.vibrate for immediate user notification.
- Warning Banner: Display a prominent banner at the top of the screen to convey immediate warnings and safety information to the user.
- Risk Legend: Provide a simple legend explaining the meaning of the color-coded risk zones (e.g., Red = High risk, Orange = Medium risk).
- Continuous Background Tracking & Offline Resilience: Enables persistent location tracking (via navigator.geolocation.watchPosition) for as long as the application's browser tab remains open, even if in the background, subject to browser permissions. All risk detection and alerting logic, using hardcoded risk zone data, functions entirely client-side, ensuring uninterrupted operation and alerts even in low or no network environments.

## Style Guidelines:

- Primary color: A vibrant yet dependable blue (#3383F7), selected to convey safety and reliability, used for interactive elements and key indicators.
- Background color: A very light, desaturated blue (#ECF1F7), providing a clean and readable backdrop, ideal for daytime visibility.
- Accent color: A contrasting yet analogous aqua-cyan (#76CFE3), used for subtle highlights and supporting visual cues without clashing with safety warnings.
- Functional colors: Utilize specific bright red for 'High Risk' and orange for 'Medium Risk' to clearly and universally indicate danger levels on the map and alerts.
- Main font: 'Inter', a modern sans-serif, for both headlines and body text to ensure clear, objective, and highly legible information crucial for safety guidance.
- Use clear, intuitive map markers for the user's location and simple, distinct circle indicators for risk zones; all icons should prioritize readability and quick comprehension.
- The layout features a dedicated warning banner at the top, immediately drawing attention to alerts, with the interactive map occupying the majority of the screen space for optimal visibility, complemented by a concise risk legend.
- Incorporate subtle, smooth UI animations for the warning banner when an alert is triggered, providing a gentle yet effective visual cue without distraction, and potentially fluid transitions for map interactions.