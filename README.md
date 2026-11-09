`# 🍲 FoodRescue AI — AI-Powered Smart Food Rescue & Donation Agent

> A modern, intelligent, full-stack food rescue platform connecting banquet halls, hotels, restaurants, hostels, supermarkets, and individuals with orphanages, homeless shelters, and NGOs in real time. Powered by multi-factor AI smart matching, predictive food safety verification, automated expiry alerts, interactive geographic mapping, and a bilingual AI chatbot (English & తెలుగు).

---

## 🌟 Key Capabilities & Features

### 1. 🤖 AI Smart Matching System (Flagship Feature)
Unlike naive or random matching, FoodRescue AI uses a **multi-factor compatibility scoring model (0–100%)**:
- **Haversine Distance (40% Weight):** Evaluates real geographic road proximity between donor pickup spot and shelter coordinates.
- **Portion & Beneficiary Fit (25% Weight):** Calculates whether available portions match the shelter's intake capacity to prevent secondary waste.
- **Shelf-Life & Perishability Urgency (20% Weight):** Foods nearing safe deadlines dynamically boost priority weighting for nearby centers.
- **AI Food Safety Verification (10% Weight):** Evaluates food handling conditions and temperature maintenance.
- **NGO Verification Bonus (5% Weight):** Rewards established, verified handling facilities.
- **Explainable Rationale:** Every recommendation includes an explicit human-readable rationale (e.g., *"High Match: 1.8 km away, perfectly satisfies 90 beneficiaries within the safe 3.5h hot-holding window"*).

### 2. 🛡️ AI Food Safety Verification Module
- Pre-evaluates preparation time, consumption deadline, food category, and storage conditions:
  - **Hot Held (>60°C):** Low bacterial risk for cooked meals.
  - **Refrigerated (0–4°C):** Extended safe preservation for perishables.
  - **Ambient / Room Temperature:** Strictly flags cooked foods held > 4 hours in the bacterial danger zone (5°C–60°C).
- Status classifications: `Safe to Consider`, `Needs Verification`, or `Expired / Unsafe`.
- **Strict Public Safety Rule:** Unsafe or expired food is blocked algorithmically from being listed or requested.

### 3. 🗺️ Interactive City Map (OpenStreetMap & Leaflet)
- Displays active food pins (green), verified orphanages/NGOs (blue), and current user location pin (slate).
- Real-time radius circles (3 km to 30 km).
- In-popup food cards with photos, available portions, safe consumption countdowns, and direct 1-click **Request Food** CTA.
- Browser Geolocation support ("Locate Me").

### 4. 💬 Bilingual AI Food Rescue Chatbot (English & తెలుగు)
- Floating widget and dedicated full-page conversational AI interface.
- Supports **English** and **తెలుగు (Telugu)** seamlessly.
- Handles FAQs on donation procedures, NGO onboarding, safety thresholds, and donation tracking.

### 5. 📊 Live Food Waste & Impact Analytics Dashboard
Calculated directly from actual SQLite database records (no hardcoded metrics):
- Total Food Rescued (kg) & Meal Portions Distributed.
- Total Beneficiaries Fed.
- CO₂ Emissions Averted from Landfills (~2.5 kg CO₂e per kg food saved).
- Agricultural Freshwater Preserved (~1,050 L per kg saved).
- Interactive Chart.js visualizations:
  - Monthly rescue volume bar chart.
  - Food categories share doughnut chart.
  - Location zone distribution horizontal bar chart.
  - Veg vs. Non-Veg dietary split.

### 6. 🔔 Automated Expiry Alerts & Dispatch Notifications
- Background worker checks listings continuously.
- Automatically marks past-deadline listings as `Expired`.
- Sends urgent proactive warnings (< 2 hours remaining) and notifications across request states (`Pending`, `Accepted`, `Ready for Pickup`, `Completed`).

### 7. ⭐ Donor Ratings & Issue Reporting
- Receivers can rate donors (1–5 stars) and write reviews upon completed rescues.
- Moderation reporting system allows users to flag suspicious or mislabeled listings for admin intervention.

---

## 👥 User Roles & Demo Accounts

The application includes an **Instant Demo Persona Switcher** on top of the navigation bar for 1-click testing:

| Role | Demo Email | Password | Organization / Persona |
|---|---|---|---|
| **Donor** | `donor@banquet.com` | `rescue123` | Grand Hyderabad Banquet Hall |
| **Donor** | `contact@sunshinebakery.com` | `rescue123` | Sunshine Artisan Bakery & Cafe |
| **Donor** | `manager@greenmart.org` | `rescue123` | GreenMart Fresh Supermarket |
| **Receiver** | `ngo@orphanage.org` | `rescue123` | Akshaya Prema Orphanage Home |
| **Receiver** | `director@hopeshelter.org` | `rescue123` | Hope Foundation Shelter |
| **Admin** | `admin@foodrescue.org` | `admin123` | Central Admin Authority |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm

### 1. Run the Full Stack Application
From the project root:

```bash
# Start backend server (serves API and built frontend on http://localhost:5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

### 2. Run in Development Mode (Optional)
If modifying client code with Hot Module Replacement (HMR):

**Terminal 1 (Backend API):**
```bash
cd server
node index.js
```

**Terminal 2 (Frontend Vite Server):**
```bash
cd client
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser (API requests automatically proxy to port 5000).

---

## 🧪 Running Automated Tests
Run the comprehensive 12-point test suite covering auth, matching algorithm, safety checks, chatbot, and analytics:

```bash
node tests/verify_system.js
```

---

## 🏗️ Technology Stack

- **Frontend:** React 19, Tailwind CSS, Lucide Icons, Leaflet (interactive maps), Chart.js & React-Chartjs-2, Vite.
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs.
- **Database:** SQLite (via `better-sqlite3`) with relational foreign keys, indexes, and seeded data.
- **AI Modules:** Haversine Proximity Engine, Multi-Factor Scoring Matching Engine, Food Safety Analyzer, Bilingual NLP Chatbot.



