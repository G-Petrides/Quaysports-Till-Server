import {Router} from 'express'
import {getImages} from "../server-modules/items/items";

let itemRouter = Router()
itemRouter.post('/GetImages', async (req, res) => {
    const images = await getImages(req.body.sku, req.body.type)
    req.body.type || !images
        ? res.set('Content-Type', 'text/plain')
        : res.set('Content-Type', 'application/json')
    res.send(images)
})

export default itemRouter