<p align="center">
  <img src="src/app/icon.svg" alt="" width="80" height="80">
</p>

<h1 align="center">Dossier</h1>

<p align="center">
  Your job search, on your own server: one profile, a tailored resume and cover letter for every job, and every application tracked from draft to offer.
</p>

<p align="center">
  <a href="https://github.com/AienTech/dossier/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/AienTech/dossier?label=release"></a>
  <a href="https://github.com/AienTech/dossier/actions/workflows/image.yml"><img alt="CI" src="https://github.com/AienTech/dossier/actions/workflows/image.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue"></a>
  <a href="https://github.com/AienTech/dossier/pkgs/container/dossier"><img alt="Docker image: ghcr.io/aientech/dossier" src="https://img.shields.io/badge/image-ghcr.io%2Faientech%2Fdossier-2496ED?logo=docker&logoColor=white"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs">
  <img alt="PostgreSQL 18" src="https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white">
</p>

Dossier keeps your career history in one profile and turns it into a clean resume. For every job you apply to, it reads the posting, shows how you match, and drafts a tailored resume and cover letter that only use facts from your profile. You refine them in a chat, download them as PDFs and track each application from draft to offer.

It's for one person on a small server: one password, your data in your own PostgreSQL database (or a single SQLite file), and an AI model of your choice. That can be a local model through Ollama or LM Studio, so your profile and documents stay on your own hardware, or a hosted one (any OpenAI-compatible API, Anthropic or Mistral), which then receives what it writes from. [Privacy](https://github.com/AienTech/dossier/wiki/Privacy) says what goes where.

**Get started:** [run it on your computer](#run-it-on-your-computer) in a few minutes, or [self-host it](#self-hosting) on a server. The [installation guide](https://github.com/AienTech/dossier/wiki) covers every way: Docker with or without Compose, Node.js, a plain Ubuntu server, CapRover, Coolify and Dokploy.

**Or download the desktop app** for Windows or Linux from the [latest release](https://github.com/AienTech/dossier/releases/latest). It runs Dossier on your computer with nothing else to install, or opens a Dossier you host. See [Desktop app](https://github.com/AienTech/dossier/wiki/Desktop-app).

## Demo

![Dossier in use: the dashboard, dragging a card on the board, a new application from a pasted posting, refining the tailored resume in the chat, the cover letter, and switching resume themes](.github/images/demo.gif)

<sub>Recorded with the demo data (Jane Doe is made up) and a stand-in AI server that answers at once, played at 1.2× speed. With a real model, reading a posting and writing the documents takes from a few seconds to a few minutes.</sub>

## Features

- **Profile:** basics, skills and languages, experience and volunteering, projects, education, certifications, publications and references, in the order you choose, with a strength meter that counts only what a profile needs. Projects (side, open-source, course or thesis work) show what you can do where your job titles don't yet. Certifications keep who issued them, their dates, credential ID and a link to verify them. Publications are cited in your own style, with bold and italics, and go on resumes word for word. Start it from an existing resume (PDF, Word or Markdown) if you like.
- **Base resume:** twelve themes and a theme builder, previewed live and printed to PDF on the server. Duplicate themes, or share them as files.
- **Find jobs:** search postings near your city, or anywhere you choose, through JSearch (LinkedIn, Indeed and more), Adzuna or FreeHire (company career pages). Save the good ones, dismiss the rest, score any of them against your profile, and start an application from a posting with one click.
- **Startups:** startups that are hiring, from YC startups' job posts and Hacker News' monthly “Who is hiring?” thread, kept to the ones that hire where you live or remotely from your country and ranked against your profile, with the address each one publishes for applications. Dossier reads their sites politely and follows their robots.txt. Start an application to one with a click; you decide whom to write to.
- **Job agent (optional):** save up to three named searches and run the enabled ones once a day, in order. It skips what you've seen, scores the new postings against your profile and keeps the best on the Agent screen, with its reasons and the searches that found them. The searches share one schedule, score/draft limits and a budget of three first-page source requests per rolling 24 hours (failed attempts count; the whole batch waits until it fits). It can prepare tailored drafts too, which wait for your review. It never sends or applies.
- **New application:** paste a posting; Dossier pulls out the details and requirements, matches them against your profile, and writes a tailored resume and cover letter in the tone you pick.
- **Never invents experience:** drafts only use facts from your profile. What the posting asks for and your profile doesn't have is shown as a gap, not made up.
- **Refine:** ask for changes in a chat, edit or regenerate any part (every part of the cover letter too: sender, date, recipient, greeting and sign-off, written in the letter's language), undo AI changes or go back to any earlier version, keep private notes.
- **Send:** an email to go with each application, to whoever the posting says to send it to, ready to copy or open in your mail app, with the resume and cover letter PDFs to attach. Edit, rewrite or refine it like the documents.
- **MCP connector (optional):** use Dossier from Claude, on claude.ai, in the Desktop and mobile apps or in Claude's command-line app, on your own Claude plan, or from another MCP app such as n8n. Claude can search for jobs, score them against your profile, read your profile and applications, and save the resume and cover letter it writes as a Draft, checked like Dossier's own. It never sends or deletes anything. Without an AI model of Dossier's own, **Write it with Claude** hands a posting to a new Claude chat. Turn it on in Settings → MCP connector (see [Connecting Claude](https://github.com/AienTech/dossier/wiki/Connecting-Claude)).
- **Gmail and Calendar (optional):** connect your Google account to send an application from your own address with its PDFs attached, see employers' replies next to each application, have the AI read what they ask and draft your answer from your profile, offer interview times you're free, and see your month and the week ahead on the dashboard, with interviews kept in step with Google Calendar both ways. Nothing is sent without your confirmation. Set it up by entering your Google OAuth client in Settings → Google, or with `DOSSIER_GOOGLE_CLIENT_ID` and `DOSSIER_GOOGLE_CLIENT_SECRET` (see [Connecting Gmail and Calendar](https://github.com/AienTech/dossier/wiki/Connecting-Gmail-and-Calendar)).
- **Track:** a board and a table of every application, and a dashboard with your funnel (last 30 days, 90 days or all time), a week-by-week chart, what's worth a look next, upcoming interviews included, and a calendar.
- **Your data:** export and import everything as one file, nightly backups, and Delete everything.

## Screenshots

![The dashboard: your funnel, a week-by-week chart and what's worth a look next](.github/images/dashboard.png)

<table>
  <tr>
    <td width="50%"><img src=".github/images/application.png" alt="An application with its tailored resume and the chat that refines it"><br>An application: the tailored resume, and a chat to refine it</td>
    <td width="50%"><img src=".github/images/new-application.png" alt="A new application, showing how the profile matches the posting's requirements"><br>A new application: how you match the posting</td>
  </tr>
  <tr>
    <td><img src=".github/images/applications.png" alt="The applications board, with columns from draft to offer"><br>Every application on a board, from draft to offer</td>
    <td><img src=".github/images/find-jobs.png" alt="Find jobs: postings near the profile's city, with one open"><br>Find jobs and start an application from a posting</td>
  </tr>
  <tr>
    <td><img src=".github/images/resume.png" alt="The base resume next to its themes"><br>The base resume, with twelve themes and a theme builder</td>
    <td><img src=".github/images/profile.png" alt="The profile editor, with its sections and strength meter"><br>One profile that every resume and letter comes from</td>
  </tr>
  <tr>
    <td><img src=".github/images/inbox.png" alt="The inbox: employers' replies from Gmail, what each one asks, and mail to link to an application"><br>Replies from Gmail, read by the AI, with answers it drafts</td>
    <td><img src=".github/images/calendar.png" alt="The dashboard on a wide window, with the calendar beside the cards: the month, and the week ahead with an interview among the Google Calendar's events"><br>Your interviews and Google Calendar on the dashboard, kept in step</td>
  </tr>
</table>

<sub>The screenshots show the demo data: Jane Doe is made up.</sub>

## Deploy on AWS EC2 or Linux Server (Native with OpenCode & PM2)

You can run Dossier directly on Linux (Amazon Linux / Ubuntu) alongside a local **OpenCode** server without needing Docker.

### 1. Prerequisites
- Node.js 20+ (Node 22 or 24 recommended)
- Chromium: `sudo dnf install -y chromium` (or `sudo apt install -y chromium-browser`)
- PM2: `sudo npm install -g pm2`
- OpenCode: `curl -fsSL https://opencode.ai/install.sh | bash`

### 2. Setup Dossier
```bash
git clone https://github.com/rajboopathiking/dossier.git ~/dossier
cd ~/dossier
npm install
npm run generate

# Initialize SQLite database and directory
mkdir -p ~/dossier-data
npx prisma migrate deploy --schema prisma/sqlite/schema.prisma
npx prisma db seed --schema prisma/sqlite/schema.prisma
```

### 3. Generate Secrets and `.env`
```bash
cp .env.example .env

# Generate secret and hash password:
SECRET=$(openssl rand -base64 32)
PASSWORD_HASH=$(npx tsx scripts/hash-password.ts "YourSecurePassword")
```
Edit `.env` and set:
```env
DOSSIER_SECRET="<YOUR_SECRET>"
DOSSIER_PASSWORD="<YOUR_PASSWORD_HASH>"
DATABASE_URL="file:/home/ec2-user/dossier-data/dossier.db"
DOSSIER_DATA_DIR=/home/ec2-user/dossier-data
PORT=3000
CHROME_PATH=/usr/bin/chromium

# Local AI Provider (OpenCode on port 4096)
DOSSIER_AI_PROVIDER=openai
DOSSIER_AI_URL=http://127.0.0.1:4096/v1
DOSSIER_AI_MODEL=opencode
```

### 4. Build & Start Both with PM2
```bash
npm run build

# Start OpenCode server:
pm2 start "opencode serve --port 4096 --hostname 127.0.0.1" --name "opencode"

# Start Dossier:
pm2 start npm --name "dossier" -- start

# Persist across server reboots:
pm2 save
pm2 startup
```

> **Note:** If you previously had Docker containers running on port 3000 (`dossier-app-1`), stop them first:
> `docker stop dossier-app-1 dossier-db-1 && docker rm dossier-app-1 dossier-db-1`

---

## Run with Docker Compose (With Local Build & OpenCode / AGY Support)

To run Dossier in Docker with all your custom changes (OpenCode, AGY CLI, PDF rendering fixes), build the container locally instead of pulling the outdated upstream image:

### 1. Build and Start Container
```bash
# Start your local OpenCode server on the host (port 4096):
opencode serve --port 4096 --hostname 0.0.0.0 &

# Build and start Dossier with Docker Compose:
docker compose -f compose.production.yml up -d --build
```
*(Or use `docker compose up -d --build` for the development setup)*

### 2. Configure `.env` for Docker
In your `.env`:
```env
DOSSIER_SECRET="<YOUR_SECRET>"
DOSSIER_PASSWORD="<YOUR_PASSWORD_HASH>"
POSTGRES_PASSWORD="<RANDOM_POSTGRES_PASSWORD>"

# Connect Dossier inside Docker to OpenCode on host:
DOSSIER_AI_PROVIDER=openai
DOSSIER_AI_URL=http://host.docker.internal:4096/v1
DOSSIER_AI_MODEL=opencode
```
> **Note:** Dossier inside Docker automatically resolves `http://localhost:4096/v1` to `http://host.docker.internal:4096/v1` via Docker's host gateway.

## Older Mac & Low-Resource Optimization (Chromium Removal)

If you are developing locally on an older MacBook (e.g., macOS Monterey 12.x or machines with 8 GB RAM), bundled Playwright Chromium is **heavy (~1 GB disk space, 400MB–600MB+ RAM)** and causes `dyld` missing symbol crashes on older macOS versions.

### Reclaim ~1 GB of Disk Space
Run the following in your Mac terminal to purge cached Playwright binaries:
```bash
rm -rf ~/Library/Caches/ms-playwright
npx playwright uninstall --all 2>/dev/null || true
```

### PDF Generation Alternatives for Older Macs
1. **Cloud Server Rendering (Recommended):** Deploy Dossier to your AWS EC2 instance (e.g., `https://dossier-app.duckdns.org`). The EC2 server handles 100% of PDF generation via its system Google Chrome (`/usr/bin/google-chrome`), requiring zero CPU or RAM on your MacBook.
2. **Browser Print Preview:** Open the resume or cover letter print preview URL (`/applications/<id>/resume/print`) and press `Cmd + P` → **Save as PDF** in your normal web browser.
3. **Use Existing Google Chrome:** If Google Chrome is already installed on your Mac, configure Dossier in `.env` to reuse it instead of downloading extra binaries:
   ```env
   CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   ```

## Self-hosting

To put Dossier on a server, on your own domain with HTTPS, follow the [installation guide](https://github.com/AienTech/dossier/wiki#self-host-on-a-server): a plain Ubuntu server with Docker Compose and Caddy (or Node.js, without Docker), CapRover, Coolify or Dokploy. Give the server at least 2 vCPUs and 2 GB of memory (see [Performance and sizing](#performance-and-sizing)).

## Documentation

The [wiki](https://github.com/AienTech/dossier/wiki) has what comes after installing:

- [Choosing an AI provider](https://github.com/AienTech/dossier/wiki/Choosing-an-AI-provider): a hosted model, or a local one with Ollama or LM Studio.
- [Choosing a job source](https://github.com/AienTech/dossier/wiki/Choosing-a-job-source): JSearch, Adzuna or FreeHire (and an unofficial one for Germany), and the job agent.
- [Connecting Gmail and Calendar](https://github.com/AienTech/dossier/wiki/Connecting-Gmail-and-Calendar): your own Google OAuth client, step by step.
- [Connecting Claude](https://github.com/AienTech/dossier/wiki/Connecting-Claude): the MCP connector, in Claude's apps and on the command line.
- [Backups and restore](https://github.com/AienTech/dossier/wiki/Backups-and-restore): exports, nightly backups and database dumps.
- <a name="upgrading"></a>[Upgrading](https://github.com/AienTech/dossier/wiki/Upgrading) to a new version.
- [Troubleshooting](https://github.com/AienTech/dossier/wiki/Troubleshooting): what the common errors mean, and what to do about them.
- [Privacy](https://github.com/AienTech/dossier/wiki/Privacy): what stays on your server and what leaves it. [PRIVACY.md](PRIVACY.md) has the details.
- [Environment variables](https://github.com/AienTech/dossier/wiki/Environment-variables): every setting the server reads.

## Known limitations

- **Desktop only:** made for a laptop or desktop browser, not for phones.
- **Single user:** one password and one profile; there are no accounts.
- **English interface:** the app itself is in English. Documents can be written in other languages; in the 21 built-in ones, their headings, dates and language levels are in that language too, and in one added with **Other language…** those stay in English.
- **One instance:** run a single copy of the app per database. The nightly backups, the AI job queue and the PDF browser live inside the app's process.

## Performance and sizing

Measured on 28 September 2026 with the production build in a container limited to 2 vCPUs and 1 GB:

- **PDFs:** the base resume renders in about 0.25 s, or 1 s when Chromium has to start first (it closes after five idle minutes). Two render at a time and the rest queue: six requested at once are done in 1.4 s. Dossier used at most about 520 MB, Chromium included, so give the container at least 768 MB.
- **Screens:** with ten times the demo data (90 applications), the dashboard and the applications list answer in 20–90 ms, and every query takes under a millisecond. With 900 applications they take up to about 0.2 s, mostly rendering; the tables are indexed for the queries they get.
- **Interactions** (changing a status, moving a card, switching tabs, opening an editor, typing, picking a theme) respond within 32 ms, and within about 100 ms on a CPU four times slower.

## Security

What protects your data, how to run Dossier safely and how to report a problem: see [SECURITY.md](SECURITY.md).

## Development

Working on Dossier itself: see [DEVELOPMENT.md](DEVELOPMENT.md).

## License

Dossier is free software under the [GNU Affero General Public License v3.0](LICENSE). You may use, change and share it; if you run a changed version for others over a network, you must offer them its source code.
# dossier
