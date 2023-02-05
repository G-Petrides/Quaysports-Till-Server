import shop = require('../server-modules/shop/shop');
import express = require('express');
import {log} from "../server-modules/log";

let router = express.Router()

router.post('/Get', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.get(req.body.QUERY));
})

router.post('/GetQuickLinks', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let result = await shop.getQuickLinks()
    res.send(result);
})

router.post('/ItemsForSearch', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let data = await shop.getItemsForSearch(req.body.QUERY)
    console.dir(data,{depth: 5})
    res.send(data);
})

router.post('/ItemForOrder', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.getItemForOrder(req.body.QUERY));
})

router.post('/RewardCard', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.rewardCard(req.body.QUERY, req.body.QUERY.id.$eq));
})

router.post('/UpdateRewardCard', async (req, res) => {
    res.set('Content-Type', 'application/json');
    log("Shop/RewardCard",req.body)
    res.send(await shop.updateRewardCard(req.body));
})

router.post('/Update', async (req, res) => {
    res.set('Content-Type', 'application/json');
    log("Shop/Update",req.body)
    res.send(await shop.update(req.body));
})

router.post('/Count', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let count = await shop.count()
    res.send({count: count});
})

router.post('/Postcodes', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.postcodes(req.body.QUERY));
})

router.post('/Orders', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.orders(req.body.QUERY));
})

router.post('/Mask', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.mask(req.body.QUERY));
})

router.post('/LastFiftyOrders', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.lastFifty());
})

router.post('/Export', async (req, res) => {
    await shop.exportOrder(req.body);
    res.set('Content-Type', 'application/json');
    res.send({status: 'done'});
})

router.post('/Import', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.importOrder())
})

router.post('/CashUp', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await shop.cashUp())
})

export = router