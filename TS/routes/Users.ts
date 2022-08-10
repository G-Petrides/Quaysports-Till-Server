import user = require('../server-modules/users/user')
import express = require('express')
import {log} from "../server-modules/log";

let router = express.Router()

router.post('/Auth', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let login = await user.auth(req.body.code)
    log("Users/Auth",login)
    res.send(login)
})

export = router