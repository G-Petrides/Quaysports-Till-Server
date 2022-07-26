import user = require('../server-modules/users/user')
import express = require('express')

let router = express.Router()

router.post('/Auth', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await user.auth(req.body.code))
})

export = router