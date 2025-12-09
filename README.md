# PayUp - Thesis Bill Splitter

A minimalist, modern web app for thesis group expense tracking. Split expenses fairly among team members, track settlements, and maintain a clear ledger.

## 🚀 Features

- **Easy Expense Tracking**: Log expenses with amounts, descriptions, categories, and receipts
- **Auto-Split**: Expenses automatically split equally among thesis group members
- **Real-Time Dashboard**: See who owes what at a glance with filtering and search
- **Settlement Tracking**: Mark payments as complete and maintain payment history
- **Secure Authentication**: Auth0 integration with Google SSO and email/password
- **Modern UI**: Built with shadcn/ui components following 60-30-10 color rule

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Authentication**: Auth0
- **Database**: Supabase (PostgreSQL with RLS)
- **Validation**: Zod
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Auth0 account and application

## 🏗️ Setup Instructions

### 1. Clone and Install

```bash
cd payup-app
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Run the database schema (see `database-schema.sql`)
3. Configure Row Level Security (RLS) policies
4. Get your project URL and service role key

### 3. Set Up Auth0

1. Create a new application on [Auth0](https://auth0.com)
2. Configure callback URLs:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
3. Get your Domain, Client ID, and Client Secret

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Auth0
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_DOMAIN=your_auth0_domain
AUTH0_ISSUER_BASE_URL=https://your_auth0_domain
AUTH0_BASE_URL=http://localhost:3000
AUTH0_SECRET=generate_a_random_32_character_secret

# Next.js
NEXTAUTH_SECRET=same_as_auth0_secret_above
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate a secret for AUTH0_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Configure Allowed Users

Edit `lib/auth.ts` and add your thesis group members' emails to the `ALLOWED_EMAILS` array.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

See `database-schema.sql` for the complete schema. Key tables:

- **users**: Thesis group members
- **expenses**: All group expenses with amounts and metadata
- **settlements**: Who owes whom, with payment status

## 📁 Project Structure

```
payup-app/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── dashboard/        # Dashboard components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # Auth utilities
│   ├── database.types.ts # TypeScript types
│   ├── supabase.ts       # Supabase client
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas
└── public/               # Static assets
```

## 🎨 Design System

Following the 60-30-10 color rule:
- **60%**: Neutral gray/white background
- **30%**: Muted blue/slate for secondary elements
- **10%**: Vibrant orange for CTAs and accents

## 🔒 Security

- Auth0 authentication with Google SSO
- Supabase Row Level Security (RLS) policies
- Email whitelist for thesis group members only
- Middleware protection on dashboard and API routes

## 📝 API Routes

- `GET /api/expenses` - List all expenses (with filters)
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Soft delete expense
- `POST /api/settlements/:id/pay` - Mark settlement as paid

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

Update your Auth0 callback URLs to include your production domain.

## 📄 License

Built for thesis teams. Feel free to use and modify.

## 🤝 Contributing

This is a private thesis project. For questions or issues, contact the team.

---

Built with ❤️ for thesis collaboration
