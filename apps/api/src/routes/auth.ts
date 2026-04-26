import { Router } from 'express'

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { AuthError, extractBearerToken, getUserByToken, loginUser, registerUser, revokeSession } from '../services/authService.js'

export const authRouter = Router()

authRouter.post('/register', async (req, res, next) => {
  try {
    const result = await registerUser({
      name: String(req.body?.name ?? ''),
      email: String(req.body?.email ?? ''),
      password: String(req.body?.password ?? ''),
    })

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.message,
      })
      return
    }

    next(error)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser({
      email: String(req.body?.email ?? ''),
      password: String(req.body?.password ?? ''),
    })

    res.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.message,
      })
      return
    }

    next(error)
  }
})

authRouter.get('/me', async (req, res, next) => {
  try {
    const token = extractBearerToken(req.header('authorization') ?? undefined)

    if (!token) {
      res.json({
        user: null,
      })
      return
    }

    const user = await getUserByToken(token)

    res.json({
      user,
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await revokeSession((req as AuthenticatedRequest).token)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
