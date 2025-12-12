# PayUp - AI Coding Assistant Instructions

## Project Overview
PayUp is a Next.js 15 bill-splitting app for thesis groups using Clerk auth, Prisma ORM, and Supabase PostgreSQL. The app enables expense tracking, auto-split calculations, and settlement management with team-based isolation.

## Architecture Patterns

### Data Flow: Server Actions → Prisma → Client
- **Server Actions**: All mutations live in `app/actions/*.ts` with `"use server"` directive
- **Transaction Pattern**: Batch related DB writes in `prisma.$transaction()` (see [app/actions/expenses.ts](app/actions/expenses.ts#L64-L98))
- **Client State**: Use SWR for caching/revalidation (e.g., [components/dashboard/team-provider.tsx](components/dashboard/team-provider.tsx#L30-L43))
- **Cache Invalidation**: After mutations, call `invalidateTeamCache(teamId, userId)` and `revalidatePath()`

### Multi-Tenancy via Teams
- Users belong to multiple teams via `TeamMember` junction table
- All queries MUST filter by `team_id` and verify membership first (see [app/actions/expenses.ts](app/actions/expenses.ts#L40-L48))
- Team context stored in `TeamProvider` ([components/dashboard/team-provider.tsx](components/dashboard/team-provider.tsx)) - access via `useTeam()` hook
- Never expose cross-team data - always check `verifyTeamMembership()` in server actions

### Database Schema ([prisma/schema.prisma](prisma/schema.prisma))
- **Soft Deletes**: Use `deleted_at` field, never hard delete
- **Monthly Expenses**: Self-referencing `parent_expense_id` creates payment series (WiFi, rent, etc.)
- **Settlements**: Auto-created when expense added - one per non-payer member at equal split
- **Indexes**: Optimized for `[team_id, deleted_at, created_at]` patterns - match these in queries

### Authentication (Clerk)
- Protected routes via [middleware.ts](middleware.ts#L4-L8) - public routes explicitly whitelisted
- Get user with `await currentUser()` from `@clerk/nextjs/server`
- Role-based access: `UserRole.SuperAdmin` for admin panel (check with `requireSuperAdmin()` in [lib/auth-utils.ts](lib/auth-utils.ts))
- User sync happens via Clerk webhooks (configured in Clerk dashboard)

### Caching Strategy ([lib/cache.ts](lib/cache.ts))
- **Upstash Redis** for team balances/stats - gracefully degrades if not configured
- Cache pattern: `cached(key, fetcher, TTL)` - returns cached or fresh data
- TTLs: Balances 30s, Stats 60s, Members 120s, Teams 180s
- **Always invalidate** after mutations using `invalidateTeamCache(teamId, userId)`

## Development Workflows

### Running Locally
```bash
npm run dev          # Next.js with Turbopack
npm run build        # Production build
npx prisma studio    # Database GUI
npx prisma generate  # Regenerate client (auto on npm install)
npx prisma migrate dev --name <name>  # Create migration
```

### Environment Setup
Required vars in `.env.local`:
- `DATABASE_URL` - Pooled Supabase connection (PgBouncer)
- `DIRECT_URL` - Direct connection for migrations
- `NEXT_PUBLIC_CLERK_*` - Clerk auth keys
- `UPSTASH_REDIS_*` (optional) - Redis caching
See [README.md](README.md#L55-L77) for complete list

### Adding New Features
1. **Database changes**: Edit [prisma/schema.prisma](prisma/schema.prisma), run `npx prisma migrate dev`
2. **Server actions**: Add to `app/actions/*.ts`, wrap in transaction if multi-step
3. **UI components**: Use shadcn/ui from `components/ui/` - import and compose
4. **Validation**: Define Zod schemas in [lib/validations.ts](lib/validations.ts)
5. **Client state**: Use SWR with cache keys from `cacheKeys` object

## Code Conventions

### File Organization
- Server actions: `app/actions/*.ts` (export async functions with `"use server"`)
- Page components: `app/**/page.tsx` (client components with `"use client"`)
- Reusable UI: `components/**/*.tsx` (prefix with "use client" if hooks needed)
- Business logic: `lib/*.ts` (pure functions, no React)

### Naming Patterns
- Server actions: `createExpense`, `updateSettlement` (verb + noun)
- React hooks: `useTeam`, `useTeamBalances` (camelCase with "use" prefix)
- Components: `AddExpenseDialog`, `ExpenseList` (PascalCase)
- Database fields: `created_at`, `team_id` (snake_case in Prisma schema)

### Error Handling
- Server actions return `{ error: string }` on failure, not thrown exceptions
- Display errors with `toast.error()` from `sonner`
- Log unexpected errors with `console.error()` - logs visible in Vercel dashboard

### Type Safety
- Import Prisma types: `import { Status, UserRole } from "@prisma/client"`
- Use `z.infer<typeof schema>` for form types from Zod schemas
- Generated Prisma types live in `.prisma/client` - never manually edit

## Key Integration Points

### Clerk → Database Sync
- Webhook at `/api/webhooks/clerk` syncs user data to Prisma
- User IDs match between Clerk and database (`user.id`)
- Name/email updated on every sign-in via webhook

### Client-Side Data Fetching
- Use SWR with `revalidateOnFocus: false` to prevent excess requests
- Dedupe interval: 10s for frequent data, 60s for stable data
- Example: [components/dashboard/team-provider.tsx](components/dashboard/team-provider.tsx#L30-L43)

### Redis Cache (Optional)
- App works without Redis - `cached()` falls back to direct DB fetch
- Enable by setting `UPSTASH_REDIS_*` env vars
- Invalidation is critical - always call `invalidateTeamCache()` after mutations

### Admin Panel
- Routes under `/app/admin/*` require `UserRole.SuperAdmin`
- Server actions use `requireSuperAdmin()` helper to verify role
- Admin can view all teams/users but should not mutate others' data without checks

## Performance Considerations

### Database Query Optimization
- Use `Promise.all()` for parallel queries (see [app/actions/admin.ts](app/actions/admin.ts#L13-L30))
- Select only needed fields: `select: { id: true, name: true }` instead of full records
- Paginate with `cursor` + `take` for large lists (expenses, settlements)
- Leverage composite indexes - match query `where` clauses to index order

### Bundle Size
- `next.config.ts` optimizes common package imports (lucide-react, radix-ui)
- Dynamic imports for heavy components: `const Chart = dynamic(() => import('./Chart'))`
- Console logs removed in production builds (except `error`/`warn`)

## Testing & Debugging
- No automated tests yet - manual testing via UI
- Use `npx prisma studio` to inspect/edit database directly
- Check Vercel logs for production errors (streamed from server actions)
- Enable Redis locally to test cache behavior before production deploy
