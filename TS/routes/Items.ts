import express = require('express')
import items = require('../server-modules/items/items')
import {log} from "../server-modules/log";
let router = express.Router()

router.post('/GetImages', async (req, res) => {
    const images = await items.getImages(req.body.sku, req.body.type)
    req.body.type || !images
        ? res.set('Content-Type', 'text/plain')
        : res.set('Content-Type', 'application/json')
    log("Items/GetImages",images)
    res.send(images)
})

export = router