import { scryptSync, timingSafeEqual } from 'node:crypto';
import account from '../data/account.json';

const registry = globalThis as typeof globalThis & { iotDemoUsers?: Map<string, { name: string; email: string; password: string }> };
export const users = registry.iotDemoUsers ??= new Map();

export function authenticate(username: string, password: string) {
  if (username.trim().toLowerCase() === account.username.toLowerCase()) {
    const hash = scryptSync(password, account.salt, 64);
    if (!timingSafeEqual(hash, Buffer.from(account.passwordHash, 'hex'))) return null;
    return { id: account.id, username: account.username, name: account.name, email: account.email };
  }
  const user = users.get(username.trim().toLowerCase());
  if (!user || user.password !== password) return null;
  return { id: 2, username: user.email, name: user.name, email: user.email };
}
