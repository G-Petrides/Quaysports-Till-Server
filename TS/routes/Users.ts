import user = require('../server-modules/users/user')
import express = require('express')
let router = express.Router()

router.post('/Auth', (req, res) => {
    user.auth(req.body.code).then(data=>{
        res.set('Content-Type', 'application/json');
        res.send(data)
    })
})

export = router