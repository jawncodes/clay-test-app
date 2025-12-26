# Clay Entries App

A Next.js web application with passwordless authentication, user enrichment via Clay.com, and per-user entry management.

## Features

- **Passwordless Authentication**: Email-based OTP (One-Time Password) login system
- **User Sign-up**: Registration form with honeypot field for bot protection
- **Clay.com Integration**: Automatic user data enrichment on sign-up
- **User Entries**: Per-user entry management with create, edit, and delete functionality
- **Admin Panel**: User management with flag, block, and unblock capabilities
- **User Enrichment**: Display Clay.com enrichment data in admin panel

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Session-based with httpOnly cookies
- **Styling**: CSS with modern UI design

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory with your Clay.com webhook configuration (see `.env.example` for reference):

```bash
CLAY_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/<YOUR_CLAY_WEBHOOK_ID_HERE>
CLAY_WEBHOOK_AUTH=<YOUR_CLAY_WEBHOOK_AUTH_TOKEN_HERE>
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Admin User

To create an admin user, you'll need to manually update the database. After signing up normally:

1. Find your user ID in the database
2. Update the user's role to 'admin':

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── entries/       # Entry CRUD endpoints
│   │   └── admin/         # Admin user management endpoints
│   ├── admin/             # Admin panel page
│   ├── login/             # Login page
│   ├── signup/            # Sign-up page
│   ├── clay-entries/      # Clay entries page
│   └── verify/            # OTP verification page
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication logic
│   ├── clay.ts            # Clay.com webhook integration
│   ├── db.ts              # Database connection
│   ├── email.ts           # Mock email service
│   ├── schema.sql         # Database schema
│   └── utils.ts           # Helper functions
└── middleware.ts          # Route protection middleware
```

## Database Schema

- **users**: User accounts with name, email, role, and status
- **otp_tokens**: One-time password tokens for authentication
- **user_entries**: User-specific entries
- **user_enrichments**: Clay.com enrichment data

## Development Notes

- OTP codes are logged to the console in development (mock email service)
- The database file (`data.db`) is created automatically on first run
- Sending data to Clay.com queues entries for enrichment (doesn't return enriched data immediately)
- Clay.com sends enriched data back via webhook callback to `/api/webhooks/clay`
- Configure Clay.com to send enriched data to: `https://your-domain.com/api/webhooks/clay`

## Security Features

- Honeypot field for bot detection
- Session-based authentication with httpOnly cookies
- Route protection via middleware
- Admin-only access control
- SQL injection prevention (parameterized queries)

---

Sample Request:

```
curl 'https://api.clay.com/v3/sources/webhook/<YOUR_WEBHOOK_ID>' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'x-clay-webhook-auth: <YOUR_WEBHOOK_AUTH_TOKEN>' \
  -d '{"email":"john.nguyen@boompop.com", "name": "John Nguyen"}'
```
