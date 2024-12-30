import { Router } from 'express'
import usersRouter from './users'
import authRouter from './auth'
import uploadRouter from './uploads'

const router = Router()

router.use('/users', usersRouter)
router.use('/auth', authRouter)
router.use('/upload', uploadRouter)

export default router
