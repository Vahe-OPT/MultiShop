import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/', (req, res) => res.json({ message: 'Server is running' }))
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
