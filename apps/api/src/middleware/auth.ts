import type { NextFunction, Request, Response } from 'express'

import { extractBearerToken, getUserByToken, type PublicUser } from '../services/authService.js'

export const ADMIN_EMAIL = 'jack.admin@example.com'

export type AuthenticatedRequest = Request & {
  user: PublicUser
  token: string
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req.header('authorization') ?? undefined)

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
      })
      return
    }

    const user = await getUserByToken(token)

    if (!user) {
      res.status(401).json({
        error: 'Invalid or expired session',
      })
      return
    }

    ;(req as AuthenticatedRequest).user = user
    ;(req as AuthenticatedRequest).token = token
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error)
      return
    }

    const user = (req as AuthenticatedRequest).user

    if (user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({
        error: 'Admin access required. This action is disabled for demo accounts to avoid API costs.',
      })
      return
    }

    next()
  })
}

export function isAdminUser(user: PublicUser | null | undefined): boolean {
  return user?.email.toLowerCase() === ADMIN_EMAIL
}
