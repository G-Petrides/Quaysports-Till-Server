import {Router} from 'express'
import {log} from "../server-modules/log";
import {auth} from "../server-modules/users/user";

let userRouter = Router()

userRouter.post('/Auth', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let login = await auth(req.body.code)
    log("Users/Auth",login)
    res.send(login)
})

export default userRouter