# Dossier --- Native macOS Installation (No Docker)

This guide runs Dossier directly on macOS using Node.js, Yarn, and a
local SQLite database. It is tailored to the reported environment:

-   macOS Monterey 12.7.6
-   Intel Mac (`x86_64`)
-   Node.js 24.13.1
-   Yarn 4 / Playwright 1.64.1

**Important limitation:** Playwright 1.64.1 does not support installing
its bundled Chromium on macOS 12. The Dossier web app may run, but PDF
generation may not work on this operating system. Do not keep retrying
`npx playwright install chromium`; it will fail for the same
compatibility reason.

## 1. Open the project directory

Run all commands from the Dossier repository root --- the directory
containing `package.json` and `prisma7.config.ts`.

``` bash
cd /path/to/dossier
```

Confirm the tools:

``` bash
sw_vers
uname -m
node -v
corepack --version
yarn --version
```

The reported architecture should be `x86_64` and Node should be version
24.x.

## 2. Install JavaScript dependencies

Enable Corepack and install the exact dependencies pinned by the
repository:

``` bash
corepack enable
yarn install --immutable
```

If `corepack enable` reports a permissions error, do not use `sudo`
blindly; configure your Node installation/Corepack path first.

## 3. Create the local data directory

Dossier can use SQLite, so a separate PostgreSQL server is not required.

``` bash
mkdir -p "$HOME/dossier-data"
```

The database file will be stored at:

``` text
/Users/YOUR_MAC_USERNAME/dossier-data/dossier.db
```

To see the exact home directory path:

``` bash
echo "$HOME"
```

## 4. Configure environment variables

Create `.env` if it does not already exist:

``` bash
cp .env.example .env
```

Open it:

``` bash
nano .env
```

Set these required values. Replace `YOUR_MAC_USERNAME` with the username
shown by `echo "$HOME"`.

``` env
DOSSIER_PASSWORD=
DOSSIER_SECRET=
DATABASE_URL="file:/Users/YOUR_MAC_USERNAME/dossier-data/dossier.db"
DOSSIER_DATA_DIR=/Users/YOUR_MAC_USERNAME/dossier-data
```

Keep the database URL as an absolute SQLite file URL beginning with
`file:`. This is important: `prisma7.config.ts` uses that prefix to
select the SQLite schema and SQLite migrations.

### Generate the sign-in password hash

Run:

``` bash
yarn hash-password
```

Follow the prompts. Copy the complete output hash (it begins with
`argon2id:`) into `.env` as the value of `DOSSIER_PASSWORD`.

Do not put your plain-text password in `.env`.

### Generate the application secret

Run:

``` bash
openssl rand -base64 32
```

Copy the output into `.env` as `DOSSIER_SECRET`.

Keep both values private. Do not commit `.env` to Git or share its
contents.

## 5. Generate both Prisma clients

Dossier has two Prisma schemas and two generated clients: PostgreSQL and
SQLite. The normal `yarn prisma generate` command only generated the
PostgreSQL client in the earlier attempt.

Run the repository's combined script instead:

``` bash
yarn generate
```

It runs both generation commands:

``` bash
yarn prisma generate
yarn prisma generate --schema prisma/sqlite/schema.prisma
```

Confirm that both generated directories exist:

``` bash
ls src/generated/prisma
ls src/generated/prisma-sqlite
```

The second directory is required by `src/lib/database.ts`. If it is
missing, the seed and Next.js build can fail with
`Cannot find module '@/generated/prisma-sqlite/client'`.

## 6. Create and migrate the SQLite database

With `DATABASE_URL` set to the `file:` URL in `.env`, run:

``` bash
yarn prisma migrate deploy
```

The Prisma config should select:

-   Schema: `prisma/sqlite/schema.prisma`
-   Migrations: `prisma/sqlite/migrations`

If Prisma says `datasource.url` is missing, check that `.env` exists in
the repository root and contains a non-empty `DATABASE_URL`. Also make
sure the value starts with `file:` if you intend to use SQLite.

## 7. Seed the built-in themes and default settings

Run:

``` bash
yarn prisma db seed
```

This loads the built-in themes and default settings. The normal seed is
intended to be safe to run again; do not use demo/reset options unless
you deliberately want sample data and understand their effects.

If the earlier missing SQLite client error appears again, run
`yarn generate` successfully first, then retry the seed.

## 8. Start Dossier in development mode

For local use and troubleshooting, start with:

``` bash
yarn dev
```

Open this address in your browser:

<http://localhost:3000>

Sign in with the plain-text password you entered when generating the
password hash.

Leave the terminal running while you use Dossier. Press `Ctrl+C` in that
terminal to stop the development server.

## 9. Optional: create a production build

Once the development server works, stop it with `Ctrl+C`, then run:

``` bash
yarn build
```

If the build completes, the package defines the production start command
as:

``` bash
yarn start
```

For initial setup on this Mac, `yarn dev` is the simpler way to verify
the application. A successful Next.js build does not prove that PDF
generation works; PDF generation also needs a compatible Chromium
browser.

## 10. macOS 12 and PDF generation

Your installed Playwright version is 1.64.1. Its browser installer
rejects macOS 12:

``` text
Playwright does not support chromium on mac12
```

This is an operating-system compatibility limitation, not a Docker or
Prisma configuration error.

Do not repeatedly run:

``` bash
npx playwright install chromium
```

Practical choices:

1.  **Keep using Dossier without PDF features for now**, if the rest of
    the application works.
2.  **Upgrade macOS**, if your Intel Mac officially supports a newer
    macOS version compatible with the Playwright release used by this
    project.
3.  **Run PDF generation on a compatible Linux machine/server**, while
    keeping local development on this Mac.
4.  **Test an older Playwright/browser combination only as a separate
    compatibility experiment.** Do not downgrade the project's locked
    dependencies blindly; it may introduce other incompatibilities.

## 11. Common errors and fixes

### Error: `The datasource.url property is required`

Check `.env`:

``` bash
grep '^DATABASE_URL=' .env
```

It must contain a value, for example:

``` env
DATABASE_URL="file:/Users/YOUR_MAC_USERNAME/dossier-data/dossier.db"
```

Run Prisma commands from the repository root.

### Error: `Cannot find module '@/generated/prisma-sqlite/client'`

Generate both clients:

``` bash
yarn generate
```

Then verify:

``` bash
ls src/generated/prisma-sqlite
```

### Error: Prisma tries to use PostgreSQL

Your `DATABASE_URL` probably does not start with `file:`. The project's
`prisma7.config.ts` selects PostgreSQL unless the URL starts with that
prefix.

Correct SQLite example:

``` env
DATABASE_URL="file:/Users/YOUR_MAC_USERNAME/dossier-data/dossier.db"
```

### Error: Chromium installation is unsupported

This is expected on macOS 12 with Playwright 1.64.1. It is not fixed by
regenerating Prisma clients or changing the database URL. See the
PDF-generation choices in section 10.

### Error: port 3000 is already in use

Stop the other process using port 3000, or start Next.js on another
port:

``` bash
PORT=3001 yarn dev
```

Then open <http://localhost:3001>.

## 12. Back up your data

Stop Dossier before copying the SQLite database:

``` bash
cp "$HOME/dossier-data/dossier.db" "$HOME/dossier-data/dossier-backup-$(date +%Y%m%d-%H%M%S).db"
```

Keep backups somewhere safe. The database contains your profile and
application information. Keep `.env` private as well because it contains
the sign-in hash and encryption secret.

## Quick start after the initial setup

After dependencies and `.env` are configured, the usual startup sequence
is:

``` bash
yarn generate
yarn prisma migrate deploy
yarn prisma db seed
yarn dev
```

Then visit <http://localhost:3000>.

You generally do not need to repeat dependency installation every time.
Run migrations when updating to a version that includes database
changes. Keep a backup before updating.

## Project references

-   Repository: <https://github.com/AienTech/dossier>
-   README: <https://github.com/AienTech/dossier#readme>
-   Prisma config: `prisma7.config.ts`
-   Main Prisma schema: `prisma/schema.prisma`
-   SQLite Prisma schema: `prisma/sqlite/schema.prisma`
-   Database selection: `src/lib/database.ts`
-   Environment template: `.env.example`

**Scope:** This is a native local-development setup for the reported
Intel macOS 12 machine. PDF generation is not guaranteed on that OS
because the bundled Playwright Chromium is unsupported.
