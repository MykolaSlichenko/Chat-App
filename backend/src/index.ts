import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import { Server } from 'http'

import { AppDataSource } from './data-source'
import defaultRouter from './routes/routes'
import { setupSocketIOServer } from './sockets/socket'
import { logger } from './utils/logger'
import path from 'path'

let retryTries = 5
;(async () => {
    try {
        while (retryTries > 0) {
            try {
                await AppDataSource.initialize()
                logger.info('Backned connected to DB')
                break
            } catch (error) {
                retryTries--
                console.warn(
                    'Connection to DB Failed, waiting 5 secs, retries left:',
                    retryTries,
                    error
                )
                await new Promise((resolve) => setTimeout(resolve, 5000))
            }
        }
        logger.info('Data source has been initalized!')
    } catch (err) {
        logger.error('error during data source initalization:', err)
    }
})()

const app = express()

const httpServer = new Server(app)

setupSocketIOServer(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
    },
})

app.use(cors())
app.use(express.json())
app.use('/', defaultRouter)

app.use('/uploads', express.static('uploads'));
console.log('path.join(__dirname, ', path.join(__dirname, 'uploads'))
// app.use(errorHandler)

const PORT = process.env.PORT
httpServer.listen(PORT, () => {
    logger.info(`LiveChat API listening on port ${PORT}`)
})
