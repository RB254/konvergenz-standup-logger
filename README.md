# Konvergenz Standup Logger

An internal productivity web tool designed for agile engineering teams to log daily standups asynchronously, track blocker trends via an automated dashboard feed, and view real-time localized weather conditions.

## 🚀 Key Features Built
- **Standup Post Client Form:** Input capture fields mapping Yesterday's progress, Today's agenda, and systemic blockers with a quick-flag checkbox.
- **Live Activity Feed:** Auto-polls backend endpoints every 10 seconds to sync peer submissions cleanly without full-page reloads.
- **Productivity Health Dashboard:** Generates dynamic 7-day retrospective analytics charting historical post frequency alongside an active blocker tracking index.
- **Weather API Engine:** Hooks natively into the Open-Meteo Public API tracking localized conditions dynamically via automated fallbacks.

## 🛠️ Stack & Architecture
- **Frontend:** React (TypeScript), CSS Grid & Flexbox
- **Backend Framework:** Python Flask, Flask-CORS
- **Database Architecture:** MongoDB

---

## ⚙️ Installation & Local Setup

### 1. Database Requirement
Ensure you have a local instance of MongoDB running on your machine:
```text
mongodb://localhost:27017/