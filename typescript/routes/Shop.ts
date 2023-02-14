import {Router} from 'express';
import {log} from "../server-modules/log";
import {
    update,
    cashUp,
    count,
    exportOrder,
    importOrder,
    lastFifty,
    mask,
    orders,
    postcodes,
    updateRewardCard,
    rewardCard,
    getItemForOrder,
    getItemsForSearch,
    getQuickLinks,
    get
} from "../server-modules/shop/shop";

let shopRouter = Router()

shopRouter.post('/Get', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await get(req.body.QUERY));
})

shopRouter.post('/GetQuickLinks', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let result = await getQuickLinks()
    res.send(result);
})

shopRouter.post('/ItemsForSearch', async (req, res) => {
    res.set('Content-Type', 'application/json');
    let data = await getItemsForSearch(req.body.QUERY)

    res.send(data);
})

shopRouter.post('/ItemForOrder', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await getItemForOrder(req.body.QUERY));
})

shopRouter.post('/RewardCard', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await rewardCard(req.body.QUERY, req.body.QUERY.id.$eq));
})

shopRouter.post('/UpdateRewardCard', async (req, res) => {
    res.set('Content-Type', 'application/json');
    log("Shop/RewardCard", req.body)
    res.send(await updateRewardCard(req.body));
})

shopRouter.post('/Update', async (req, res) => {
    res.set('Content-Type', 'application/json');
    log("Shop/Update", req.body)
    res.send(await update(req.body));
})

shopRouter.post('/Count', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send({count: await count()});
})

shopRouter.post('/Postcodes', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await postcodes(req.body.QUERY));
})

shopRouter.post('/Orders', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await orders(req.body.QUERY));
})

shopRouter.post('/Mask', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await mask(req.body.QUERY));
})

shopRouter.post('/LastFiftyOrders', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await lastFifty());
})

shopRouter.post('/Export', async (req, res) => {
    await exportOrder(req.body);
    res.set('Content-Type', 'application/json');
    res.send({status: 'done'});
})


shopRouter.post('/Import', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await importOrder())
})

shopRouter.post('/CashUp', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(await cashUp())
})

export default shopRouter