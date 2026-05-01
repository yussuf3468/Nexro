# Nexro — Secure File Sharing

**End-to-end encrypted file sharing.** Upload any file (images, videos, documents), share via a unique 8-character access code. The server **never** sees plaintext data or the raw access code — decryption happens entirely in your browser.

## Features

- 🔐 **AES-256-GCM encryption** — files encrypted client-side before upload
- 🔑 **Zero-knowledge access codes** — bcrypt-hashed server-side; raw code never stored
- 📦 **Large file support** — streaming 10 MB chunks; File System Access API for 200 MB+
- ⏳ **Expiry & download limits** — optional time-based expiry or max download count
- 📱 **Progressive Web App** — installable, offline shell, service worker caching
- 🛡️ **Rate limiting** — 5 attempts per IP per 15 minutes; IP hashed for privacy
- 🔲 **QR code sharing** — generated client-side for easy mobile access

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/your-username/nexro.git
cd nexro
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Project URL** and **anon/public key** from _Settings → API_
3. Also copy the **service_role** key (keep this secret)

### 3. Run the database migration

In the Supabase dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/001_initial.sql
```

This creates the `files`, `upload_sessions`, and `access_attempts` tables plus required RPC functions.

### 4. Create the storage bucket

In the Supabase dashboard → **Storage**:

1. Create a new bucket named **`encrypted-files`**
2. Set it to **Private** (do not enable public access)
3. Add a storage policy that allows only the service role to read/write:

```sql
-- Allow service role full access (already has this by default)
-- Deny all anon/authenticated access to this bucket
CREATE POLICY "deny_all_public"
ON storage.objects FOR ALL
USING (false);
```

> Since all API routes use the `service_role` key (bypasses RLS), encrypted files are only accessible via signed URLs generated server-side after token verification.

### 5. Set environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                        | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only)        |
| `SESSION_SECRET`                | Random 32+ char string for HMAC session tokens |
| `CRON_SECRET`                   | Secret for `/api/cron/cleanup` endpoint        |
| `NEXT_PUBLIC_APP_URL`           | Your deployment URL (e.g. `https://nexro.app`) |

### 6. Generate PWA icons

```bash
npm install -D sharp
node scripts/generate-icons.mjs
```

This reads `public/icons/icon.svg` and produces PNG icons at all required sizes.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Vercel (recommended)

```bash
npm run build
vercel deploy
```

Set all environment variables in the Vercel dashboard.

> **File size note:** Vercel serverless functions have a 4.5 MB request body limit. For large files this app works around it by uploading chunks directly to Supabase Storage from the client (the `/api/upload/chunk` route receives the binary and passes it through). If you hit issues, consider self-hosting or using Vercel's [Blob Storage](https://vercel.com/docs/storage/vercel-blob) as an alternative.

### Cron cleanup

Set up a daily cron job hitting:

```
GET /api/cron/cleanup
Authorization: Bearer <CRON_SECRET>
```

On Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## Security Architecture

### End-to-end encryption flow

```
Browser                              Server
──────────────────────────────────   ──────────────────────
1. User picks file + access code
2. PBKDF2-SHA256(code, salt, 200k iter) → AES-256-GCM key
3. Encrypt file in 10 MB chunks                         →  Store encrypted bytes
   (per-chunk IV = baseIV XOR chunkIndex)
4. bcrypt.hash(normalizedCode, 12)                      →  Store only the hash
5. salt + baseIV + chunkCount                           →  Store (public metadata)

──── Download ────

6. User enters access code
7.                                   →  POST /api/files/:id/access
8.                                   ←  bcrypt.compare(code, storedHash)
9.                                   ←  Returns: sessionToken + salt + baseIV
10. PBKDF2-SHA256(code, salt) → key
11. Fetch chunks via sessionToken
12. Decrypt each chunk in browser
13. Reassemble → plaintext file ✓
```

**Why this is secure:**

- The server stores only bcrypt(accessCode) — it cannot reverse or brute-force the real code without the salt+pepper
- The AES key is derived from the access code using PBKDF2 with 200,000 iterations — infeasible to brute-force the key from stored salt
- Even if the Supabase bucket is compromised, encrypted blobs are useless without the access code
- Session tokens are HMAC-SHA256 signed, expire in 1 hour, and tied to a specific `fileId`

### Rate limiting

Access attempts are tracked per `(fileId, hashedIP)` in the `access_attempts` table. After 5 failures within 15 minutes, further attempts are blocked. IPs are hashed with SHA-256 so they are not stored in plaintext.

---

## API Reference

All API routes are under `/api/`.

### Upload flow

| Method | Path                                  | Description                                                                                                                              |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/upload/init`                    | Create an upload session. Body: `{ fileName, fileSize, mimeType, chunkCount, expiry?, maxDownloads? }`. Returns `{ fileId, sessionId }`. |
| `POST` | `/api/upload/hash-code`               | Hash the raw access code. Body: `{ accessCode }`. Returns `{ hash }`.                                                                    |
| `POST` | `/api/upload/chunk/:sessionId/:index` | Upload a single encrypted chunk (binary body). Returns `{ ok: true }`.                                                                   |
| `POST` | `/api/upload/complete`                | Finalise the upload. Body: `{ fileId, sessionId, accessCodeHash, salt, iv, chunkCount, ... }`. Returns `{ fileId }`.                     |

### Access flow

| Method | Path                                 | Description                                                                                                                             |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/files/:id`                     | Get public file metadata (name, size, expiry). No authentication.                                                                       |
| `POST` | `/api/files/:id/access`              | Verify access code. Body: `{ accessCode }`. Returns `{ sessionToken, salt, iv, chunkCount, fileName, mimeType, fileSize }`.             |
| `GET`  | `/api/files/:id/chunk/:index?token=` | Download a single encrypted chunk. Requires `token` query param (from access response). Returns 302 redirect to a 60-second signed URL. |

### Maintenance

| Method | Path                | Description                                                                                                          |
| ------ | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/cron/cleanup` | Soft-delete expired/exhausted files and purge their storage objects. Requires `Authorization: Bearer <CRON_SECRET>`. |

---

## Project Structure

```
nexro/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   ├── init/route.ts
│   │   │   ├── hash-code/route.ts
│   │   │   ├── chunk/[sessionId]/[index]/route.ts
│   │   │   └── complete/route.ts
│   │   ├── files/[id]/
│   │   │   ├── route.ts
│   │   │   ├── access/route.ts
│   │   │   └── chunk/[index]/route.ts
│   │   └── cron/cleanup/route.ts
│   ├── file/[id]/page.tsx        # File access page
│   ├── upload/page.tsx           # Upload page
│   ├── offline/page.tsx          # PWA offline fallback
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/
│   ├── ui/                       # Button, Input, Card, Badge, Progress, Spinner
│   ├── upload/                   # FileDropzone, EncryptionProgress, SuccessCard
│   ├── file/                     # AccessForm, FilePreview
│   └── QRCodeDisplay.tsx
├── hooks/
│   ├── useUpload.ts
│   └── useFileAccess.ts
├── lib/
│   ├── crypto.ts                 # Client-side AES-256-GCM (WebCrypto API)
│   ├── crypto-server.ts          # Server-side Node.js crypto (HMAC, SHA-256)
│   ├── supabase.ts               # Browser Supabase client
│   ├── supabase-server.ts        # Admin Supabase client (service role)
│   ├── rate-limit.ts             # DB-backed rate limiting
│   └── utils.ts
├── types/index.ts
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icons/                    # PNG icons (generate with scripts/generate-icons.mjs)
├── scripts/
│   └── generate-icons.mjs
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

---

## Environment Variables

```env
# Supabase (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase (server-only — never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# HMAC signing secret for session tokens (generate with: openssl rand -hex 32)
SESSION_SECRET=your-secret-here

# Authorization secret for the cron cleanup endpoint
CRON_SECRET=your-cron-secret-here

# Your public app URL (used for QR codes and share links)
NEXT_PUBLIC_APP_URL=https://nexro.app
```

---

## License

MIT
