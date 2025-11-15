import express from 'express'
import { signUp, logIn, logOut } from '../controllers/auth.controllers.js'

const authRouter = express.Router()

authRouter.post("/signup", signUp)
authRouter.post("/login", logIn)
authRouter.post("/logOut", logOut)

export default authRouter