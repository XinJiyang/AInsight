import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

import { prisma } from '../lib/db.js'

const PASSWORD_ITERATIONS = 120_000
const PASSWORD_KEY_LENGTH = 32
const SESSION_DAYS = 30

export type PublicUser = {
  id: string
  name: string
  email: string
}

export function toPublicUser(user: { id: string; name: string; email: string }): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
}): Promise<{ user: PublicUser; token: string }> {
  const email = normalizeEmail(input.email)
  const name = input.name.trim()

  if (name.length < 2) {
    throw new AuthError('Name must be at least 2 characters', 400)
  }

  if (!isValidEmail(email)) {
    throw new AuthError('A valid email is required', 400)
  }

  validatePassword(input.password)

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existing) {
    throw new AuthError('This email is already registered', 409)
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(input.password),
    },
  })
  const token = await createSession(user.id)

  return {
    user: toPublicUser(user),
    token,
  }
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<{ user: PublicUser; token: string }> {
  const email = normalizeEmail(input.email)
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AuthError('Invalid email or password', 401)
  }

  const token = await createSession(user.id)

  return {
    user: toPublicUser(user),
    token,
  }
}

export async function getUserByToken(token: string): Promise<PublicUser | null> {
  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: true,
    },
  })

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null
  }

  return toPublicUser(session.user)
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.authSession.deleteMany({
    where: {
      tokenHash: hashToken(token),
    },
  })
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message)
  }
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })

  return token
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, 'sha256').toString('hex')
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${hash}`
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [algorithm, iterationsText, salt, storedHash] = passwordHash.split('$')

  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !salt || !storedHash) {
    return false
  }

  const iterations = Number(iterationsText)
  const computed = pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, 'sha256')
  const stored = Buffer.from(storedHash, 'hex')

  return stored.length === computed.length && timingSafeEqual(stored, computed)
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new AuthError('Password must be at least 8 characters', 400)
  }
}
