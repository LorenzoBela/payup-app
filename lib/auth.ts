import { auth, currentUser } from '@clerk/nextjs/server';

// Get the current authenticated user safely
export async function getAuthUser() {
  const user = await currentUser();
  return user;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const user = await currentUser();
  return user;
}

// Whitelist of allowed thesis member emails
const ALLOWED_EMAILS: string[] = [
  // Add your thesis group members' emails here
  // 'member1@example.com',
  // 'member2@example.com',
  // 'member3@example.com',
];

export function isAllowedUser(email: string): boolean {
  // If no emails are configured, allow all users (for development)
  if (ALLOWED_EMAILS.length === 0) {
    return true;
  }
  return ALLOWED_EMAILS.includes(email);
}

