# 🔬 VirtualLab — Interactive Science Experiments

A premium, full-stack virtual laboratory web application built with **Next.js 16**, **Supabase**, and **TypeScript**. Students can perform interactive physics and chemistry experiments, visualize results with real-time graphs, solve problems with built-in calculators, and save their experiment data to a personal dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

---

## ✨ Features

- **1 Interactive Experiment** — RC Circuit simulation
- **Real-time Canvas Simulations** — animated visualizations rendered via HTML5 Canvas API
- **Dynamic Graphs** — interactive, auto-updating graphs with inline sliders
- **Formula Calculators** — step-by-step problem-solving with formulas
- **User Authentication** — email-based sign up/sign in with Supabase Auth
- **Personal Dashboard** — save, view, and manage experiment results
- **Premium Dark UI** — glassmorphism, gradients, smooth animations
- **Fully Responsive** — works on desktop, tablet, and mobile

---

## 🧪 Experiments

| #  | Experiment               | Subject   | Key Formula / Concept               |
|----|--------------------------|-----------|--------------------------------------|
| 1  | 🔌 RC Circuit            | Physics   | τ = RC, V = V₀(1−e^(−t/τ))         |

Each experiment has **3 tabs**:
1. **⚡ Simulation** — interactive canvas-based visualization with adjustable controls
2. **📊 Graphs** — real-time updating graphs with inline parameter sliders
3. **🧮 Calculator** — formula solver with step-by-step solution display

---

## 🛠️ Tech Stack

| Layer       | Technology                        | Purpose                              |
|-------------|-----------------------------------|--------------------------------------|
| Framework   | Next.js 16 (App Router)           | Server-side rendering, routing       |
| Frontend    | React 19 + TypeScript             | UI components, state management      |
| Styling     | Vanilla CSS + CSS Variables       | Premium dark theme, glassmorphism    |
| Backend     | Supabase                          | Authentication, PostgreSQL database  |
| Graphs      | HTML5 Canvas API                  | Custom-drawn, real-time graphs       |
| Deployment  | Vercel / Netlify (compatible)     | Production hosting                   |

---

## 📁 Project Structure

```
virtual-lab/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth routes (login, signup)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/           # User dashboard (saved results)
│   │   │   └── page.tsx
│   │   ├── experiments/
│   │   │   ├── page.tsx         # Experiments listing page
│   │   │   └── [slug]/page.tsx  # Dynamic experiment page
│   │   ├── globals.css          # Global styles & design system
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   ├── experiments/         # RC Circuit experiment component
│   │   │   └── RCCircuit.tsx
│   │   ├── Graph.tsx            # Reusable graph component
│   │   ├── FormulaCalculator.tsx # Reusable calculator component
│   │   ├── Navbar.tsx           # Navigation bar
│   │   └── Footer.tsx           # Footer
│   └── lib/
│       └── supabase/            # Supabase client setup
│           ├── client.ts        # Browser client
│           └── server.ts        # Server client
├── supabase/
│   └── schema.sql               # Database schema
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd virtual-lab

# 2. Install dependencies
npm install

# 3. Set up environment variables
#    Create a .env.local file with your Supabase credentials:
echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key" >> .env.local

# 4. Apply the database schema
#    Run the contents of supabase/schema.sql in your Supabase SQL Editor

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📷 Pages Overview

| Page              | Route                        | Description                           |
|-------------------|------------------------------|---------------------------------------|
| Home              | `/`                          | Landing page with hero & feature cards |
| Experiments       | `/experiments`               | Browse the RC Circuit experiment      |
| Experiment Detail | `/experiments/[slug]`        | RC Circuit experiment with 3 tabs     |
| Dashboard         | `/dashboard`                 | User's saved experiment results       |
| Login             | `/login`                     | Email-based sign in                   |
| Sign Up           | `/signup`                    | Create new account                    |

---

## 📄 License

This project is built for educational purposes.
