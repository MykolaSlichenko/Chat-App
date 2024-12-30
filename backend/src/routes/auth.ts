import { Router } from 'express'

import {
    login,
    register,
} from '../controllers/auth'
import {
    FormSchemaLoginData,
    FormSchemaRegisterData,
    validatorCreator,
} from '../middleware/validation/auth'

const router = Router({ mergeParams: true })

router.post('/register', [validatorCreator(FormSchemaRegisterData)], register)
router.post('/login', [validatorCreator(FormSchemaLoginData)], login)


export default router
