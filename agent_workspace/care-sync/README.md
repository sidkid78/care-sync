# CareSync

**CareSync** is a modern, AI-powered family caregiving application designed to coordinate care for seniors. It bridges the gap between family members, caregivers, and medical professionals with features like automated medical digests, medication tracking, and a shared family feed.

## ✨ Features

- **👨‍👩‍👧‍👦 Family Management**: Create or join family circles to coordinate care within a secure, invite-only group.
- **🎙️ Doctor Digest**: Record doctor visits and let our AI (powered by Google Gemini) automatically transcribe, summarize, and extract actionable tasks.
- **💊 Med Scanner**: Manage and track medications (context implied).
- **👴 Senior Mode**: A simplified, high-contrast interface designed specifically for seniors to easily view their schedule and updates.
- **📅 Shared Calendar & Shifts**: Coordinate care shifts among family members (General, Medical, Social, Rest, Admin).
- **💬 Family Feed**: A real-time activity stream for updates, completed tasks, and "vibe checks".
- **🔐 Secure Vault**: Store sensitive documents with zero-knowledge encryption headers.
- **💳 Premium Subscriptions**: Unlock advanced AI features with secure monthly billing via Stripe.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
  - *Design Specs*: Custom "Warm Clinical" palette (Sage, Clay, Blush, Lavender) with glassmorphism and micro-interactions.
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **AI**: [Google Gemini API](https://ai.google.dev/) (Multimodal processing)
- **Payments**: [Stripe](https://stripe.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn** or **pnpm**
- A **Supabase** project
- A **Google Cloud Console** project with Gemini API enabled

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/sidkid78/care-sync.git
    cd care-sync
    ```

2. **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3. **Environment Setup**:
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Google Gemini AI Configuration
    GOOGLE_GENAI_API_KEY=your_gemini_api_key

    # Stripe Payment Configuration
    STRIPE_SECRET_KEY=your_stripe_secret_key
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    STRIPE_PRICE_ID=your_stripe_price_id
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ```

4. **Database Migration**:
    Ensure your Supabase database schema is up to date. You can find migration files in `supabase/migrations`.

### Running the App

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📁 Project Structure

```bash
care-sync/
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── actions/          # Server Actions
│   ├── api/              # API Routes (doctor-digest, etc.)
│   ├── dashboard/        # Main Dashboard Page
│   ├── onboarding/       # User Onboarding Flow
│   ├── senior/           # Senior Mode Interface
│   └── ...
├── components/           # Reusable React Components
│   ├── ai/               # AI-specific components (Recorder, etc.)
│   └── ...
├── lib/                  # Library code (utils, constants)
├── supabase/             # Supabase configurations & migrations
│   └── migrations/       # SQL Migration files
├── utils/                # Utility functions
│   └── supabase/         # Supabase client/server connection helpers
└── public/               # Static assets
```

## 🎨 Design System

CareSync uses a custom "Warm Clinical" design system defined in `app/globals.css`.

- **Sage (`--sage-*`)**: Primary brand color, representing health and calm.
- **Clay (`--clay-*`)**: Neutral backgrounds, representing warmth and stability.
- **Blush (`--blush-*`)**: Accents for urgency or warmth.
- **Lavender (`--lav-*`)**: Used for AI-related features and magic moments.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
