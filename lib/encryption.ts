import * as crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, 'salt-secret', 1000, 64, 'sha512')
    .toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return computed === hash;
}
