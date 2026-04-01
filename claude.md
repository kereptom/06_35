# 06_35 — Wheel of 35

## What This Is

A minimalist mobile-first web app for a man turning 35. A single round wheel containing 100 short pieces of wisdom — advices, tips, and things to reflect on. The user spins or scrolls through them one by one.

## Design

- **White background**, nothing else competing for attention
- **Minimalist** — no navbar, no footer, no clutter. Just the wheel and the words
- **Typography-driven** — clean sans-serif font, generous whitespace
- **Single page** — no routing needed
- **Mobile-first** — designed for phone screens, works on desktop too
- **Dynamic feel** — smooth animations on the wheel rotation/transitions

## The Wheel

- A circular/round element centered on screen
- Contains 100 short texts (1-2 sentences max each)
- User can spin/swipe/tap to rotate to the next piece
- Current text is prominently displayed in the center or near the wheel
- Subtle animation on each transition (rotate, fade, slide — pick what feels right)
- Optional: small indicator showing which number out of 100 (e.g., "37/100")

## Content — 100 Items

Mix of three categories, shuffled together naturally:

1. **Advices** — direct, practical life advice for a 35-year-old man
2. **Tips** — small actionable things to try or change
3. **Reflections** — questions or prompts to think about

Each item should be short, punchy, honest, and real. No corporate motivational poster energy. Speak like a wise friend, not a self-help book.

## Tech Stack

- **Next.js** (App Router, single page)
- **Tailwind CSS** — for styling
- **Framer Motion** or CSS animations — for wheel/transition dynamics
- **TypeScript**
- No database, no auth, no API — pure static frontend

## Deployment

- Push to a **new GitHub repository** called `06_35`
- Deploy on **Vercel** — connect the repo, zero-config deploy
- Should work instantly as a phone-friendly URL to share

## Build Steps

1. `npx create-next-app@latest 06_35 --typescript --tailwind --app --src-dir=false`
2. Clean out boilerplate — strip default page content
3. Create the 100 content items in a data file (`data/wisdom.ts`)
4. Build the wheel component with rotation/spin interaction
5. Style everything minimalist — white bg, clean type, centered layout
6. Add touch/swipe support for mobile
7. Test on mobile viewport
8. Init git, push to GitHub
9. Connect to Vercel and deploy
