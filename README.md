# Hassan Abdi Hassan — Portfolio

Cinematic personal portfolio for **Hassan Abdi Hassan** — data analyst, AI & automation builder, innovation professional, researcher and facilitator based in Mogadishu, Somalia.

## What this portfolio highlights

- Data analysis and quantitative research
- AI assistants and workflow automation
- Web and product development
- Innovation programs, facilitation and business development
- Selected public speaking, training and Innovation Hub work
- Projects including the Benadir University student portal/AI assistant, Boss Baby ERP/POS, I24 Smart Grain Detector, Skills2Job Career Matcher, HoyHel and a private tax-control dashboard prototype

## Stack

- Static HTML/CSS/JavaScript frontend
- Vercel serverless API for the contact form
- Neon Postgres for contact submissions and portfolio events
- `@neondatabase/serverless`

## Local preview

### Full local app

Install dependencies and run through Vercel's local runtime:

```bash
npm install
npx vercel dev
```

Then open the localhost URL printed by Vercel.

Create a local `.env.local` with:

```bash
DATABASE_URL=your_neon_connection_string
```

The env file is ignored by Git and must never be committed.

### UI-only preview

For a quick static visual check without the contact API:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Database

The schema is stored in `database/schema.sql`.

Tables:

- `contact_messages`
- `portfolio_events`

The live Neon project is configured separately from the repository. No database credentials are committed.

## Deployment

The repository is ready for Vercel. `vercel.json` keeps clean URLs enabled.

After deployment, configure `DATABASE_URL` as an encrypted Vercel environment variable for Production and Preview before testing the contact form.

## Repository scope

This repository is intentionally standalone.

**Only `Darkprince404-ops/My_portafolio` is modified by this portfolio project. Other Hassan repositories remain untouched.**
