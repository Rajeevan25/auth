import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Precomputed dummy bcrypt hash to defend against timing attacks when user doesn't exist
const DUMMY_HASH = '$2a$12$e80yvYq5eU55x/r3.s0r3.xQ2pW43M9eMhG6C6bYg7K8vF9yB11r2';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function dummyComparePassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, DUMMY_HASH);
}

