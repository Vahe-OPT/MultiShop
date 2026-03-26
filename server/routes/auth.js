import { Router } from 'express'
import { register, login } from '../controllers/authController.js'
import protect from '../middlewares/protect.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

export default router
