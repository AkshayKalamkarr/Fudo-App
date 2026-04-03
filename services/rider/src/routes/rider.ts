import express from 'express'
import { isAuth } from '../middlewares/isAuth.js'
import { fetchMyProfile } from '../controller/rider.js'

const router = express.Router()

router.get("/myprofile",isAuth,fetchMyProfile)




export default router