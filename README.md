# ?? VeriMail Identity & Auth Console

[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-ready **Identity & Authentication Console** built with **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Firebase Authentication**. It provides a modern authentication portal for user login, registration, email verification workflows, custom action handlers, and primary email lifecycle management.

---

## ?? Key Features

- ?? **Complete Authentication Suite**: Seamless user registration, password-based login, session persistence, and secure logout.
- ?? **Email Verification Center**: Real-time verification badge status, automated verification email triggers, and custom resend throttling.
- ?? **Action Handler Engine**: Built-in handler for Firebase out-of-band actions (`verifyEmail`, `resetPassword`, `recoverEmail`).
- ?? **Primary Email Lifecycle Management**: Manage multiple email identifiers, request verification on secondary addresses, and promote verified emails to primary.
- ? **Modern Responsive UI**: Sleek dark/glassmorphic interface with micro-interactions powered by Tailwind CSS and Motion animations.
- ??? **Interactive Setup Guide**: Integrated step-by-step console guide for configuring Firebase projects and custom domain templates.

---

## ?? How to Run & Visit the Website

### 1. Clone the Repository
```bash
git clone https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console.git
cd verimail-auth-console
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (Optional)
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Optional Firebase or Gemini API Keys
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Visit the Website
Open your browser and navigate to:
?? **[http://localhost:3000/](http://localhost:3000/)** (or `http://127.0.0.1:3000/`)

---

## ?? Project Structure

```text
verimail-auth-console/
+-- src/
¦   +-- components/
¦   ¦   +-- ActionHandlerView.tsx       # Handles verifyEmail, resetPassword & email recovery links
¦   ¦   +-- ConsoleSetupGuide.tsx      # In-app Firebase configuration walkthrough
¦   ¦   +-- EmailManagementView.tsx    # Multi-email and primary email lifecycle manager
¦   ¦   +-- VerificationCenterView.tsx # Verification status dashboard & email trigger
¦   +-- lib/
¦   ¦   +-- firebase.ts                # Firebase client SDK initialization & auth helpers
¦   +-- types/
¦   ¦   +-- auth.ts                    # TypeScript definitions for users, tokens & actions
¦   +-- App.tsx                        # Main SPA Layout & View Controller
¦   +-- index.css                      # Global Tailwind styling & theme utilities
¦   +-- main.tsx                       # React DOM entrypoint
+-- index.html                         # SPA HTML wrapper
+-- package.json                       # Scripts and project dependencies
+-- tsconfig.json                      # TypeScript compiler configuration
+-- vite.config.ts                     # Vite build configuration
```

---

## ??? Technology Stack

- **Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 8
- **Styling**: Tailwind CSS 4, Lucide React Icons
- **Animations**: Motion (`motion/react`)
- **Backend / Auth Provider**: Firebase Authentication (SDK v12)

---

## ?? License
This project is open source and available under the [MIT License](LICENSE).
