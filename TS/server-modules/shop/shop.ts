import mongoI = require('../mongo-interface/mongo-interface');
import linn = require("../linn-api/linn-api");
import {tillServer} from "../../index";

interface item {
    SKU: string,
    LINNID?: string,
    EAN?: string,
    TITLE?: string,
    QSPRICEINCVAT?: string,
    SHOPPRICEINCVAT?: number,
    PURCHASEPRICE?: number,
    STOCKTOTAL?: number
}

interface giftCard {
    _id?: string,
    id: string,
    active: boolean,
    amount?: number
}

interface stockError {
    TITLE?: string
    SKU: string
    CHECKED: boolean
    QTY: number
    PRIORITY: boolean
}

interface stockReport {
    SKU: string,
    QTY: string,
}

export const binarySearch = function <T>(arr:T[], key:keyof T, x:T[keyof T], start = 0, end = arr.length):T | null {

    if (start > end || arr.length === 0 || !x) return null;

    let mid = Math.floor((start + end) / 2);
    if (arr[mid][key] === x) return arr[mid];

    return arr[mid][key] > x
        ? binarySearch(arr, key, x, start, mid - 1)
        : binarySearch(arr, key, x, mid + 1, end);
}

export const get = async (query: object) => {
    return await mongoI.find<tillServer.order>("Shop", query)
}

export const getQuickLinks = async ()=>{
    const query = [
        {
            '$match': {}
        }, {
            '$lookup': {
                'from': 'Items',
                'let': {
                    'sku': '$links.SKU'
                },
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$in': [
                                    '$SKU', '$$sku'
                                ]
                            }
                        }
                    }, {
                        '$project': {
                            'SKU': 1,
                            'SHOPPRICEINCVAT': 1,
                            'TITLE': 1
                        }
                    },
                    {
                        '$sort': {
                            'SKU': 1
                        }
                    }
                ],
                'as': 'updates'
            }
        }
    ]
    interface QuickLinks { _id:string, id:string, links:QuickLinkItem[], updates?:QuickLinkItem[] }
    interface QuickLinkItem { SKU:string | null,TITLE?:string,SHOPPRICEINCVAT?:string }

    let result = await mongoI.findAggregate<QuickLinks>("Shop-Till-QuickLinks", query)
    if(!result) return result
    for (let quickLinks of result) {
        for (let index in quickLinks.links) {
            if(!quickLinks.links[index].SKU || !quickLinks.updates) continue
            let search = binarySearch<QuickLinkItem>(quickLinks.updates!, "SKU", quickLinks.links[index].SKU)
            if (search) quickLinks.links[index] = {...quickLinks.links[index],...search}
        }
        delete quickLinks.updates
    }
    return result
}

export const count = async () => {
    let result = await mongoI.findOne<tillServer.order>("Shop", {}, {}, {_id: -1}, 1)
    return result ? Number(result.id.substring(6, result.id.length)) + 1 : 1;
}

export const update = async (order: tillServer.order) => {
    if (order._id !== undefined) delete order._id
    if (order.paid === 'true') await adjustStock(order)
    return await mongoI.setData("Shop", {id: order.id}, order)
}

export const adjustStock = async (order: tillServer.order) => {
    let stockData = []

    let skuSet = new Set(order.order.map(item => item.SKU))
    let skuString = ""
    for (let sku of skuSet) skuString += skuString === "" ? `'${sku}'` : `,'${sku}'`

    let query = `SELECT si.ItemNumber AS SKU,
                        sl.Quantity   AS QTY
                 FROM [StockItem] si
                     INNER JOIN [StockLevel] sl
                 on si.pkStockItemId = sl.fkStockItemId
                 WHERE sl.fkStockLocationId = '00000000-0000-0000-0000-000000000000'
                   AND si.bLogicalDelete = 0
                   AND si.ItemNumber IN (${skuString})
                 GROUP BY si.ItemNumber, sl.Quantity`
    let stockLevels = JSON.parse(await linn.getLinnQuery(query)).Results as stockReport[]
    let stockMap = new Map(stockLevels!.map(info => [info.SKU, parseInt(info.QTY)]))


    for (let item of order.order) {
        let details = null

        if (!item.LINNID || item.LINNID === "" || !stockMap.has(item.SKU)) continue;
        details = {
            "SKU": item.SKU,
            "LocationId": "00000000-0000-0000-0000-000000000000",
            "Level": -item.QTY
        }

        if ((stockMap.get(item.SKU)! -item.QTY) <= 0) {
            let stockError: stockError = {
                CHECKED: false,
                PRIORITY: true,
                QTY: 0,
                SKU: item.SKU,
                TITLE: item.TITLE
            }
            if ((stockMap.get(item.SKU)! - item.QTY) === 0) stockError.PRIORITY = false
            await mongoI.setData("Shop-Stock-Report", {SKU: item.SKU}, stockError)
        }

        if (details) stockData.push(details)
    }

    const processResult = JSON.parse(await linn.adjustStock(stockData, order.id))

    let processed = true
    let processedMsg = ""
    for (let result of processResult) {
        processedMsg = result.LastUpdateOperation
        if (result.PendingUpdate) processed = false
    }

    order.linnstatus = {
        Message: processedMsg,
        OrderId: order.id,
        Processed: processed.toString()
    }
    if(order._id) delete order._id
    await mongoI.setData("Shop", {id: order.id}, order)

    return
}

export const postcodes = async (id: string) => {

    const result = await mongoI.find<tillServer.order>("Shop", {"address.postcode": {$regex: id, $options: "i"}},
        {address: 1})

    let combine: { postcode: string, numbers: string[] }[] = []
    if (result) {
        for (let v of result) {
            let pos = combine.map(address => address.postcode).indexOf(v.address.postcode)
            if (pos === -1) {
                combine.push({postcode: v.address.postcode, numbers: [v.address.number]})
            } else {
                if (combine[pos].numbers.indexOf(v.address.number) === -1) combine[pos].numbers.push(v.address.number)
            }
        }
    }
    return combine
}

export const orders = async (id: string) => {
    return await mongoI.find<any>("Shop", {"id": {$regex: id, $options: "i"}})
}

export const lastFifty = async () => {
    return await mongoI.find<any>("Shop", {}, {}, {$natural: -1}, 50)
}

export const returnOrRma = async (id: string, order: tillServer.order) => {
    if (!order.linnid) return {status: 'done!'}

    const linnOrder = JSON.parse(await linn.getOrder(order.linnid))

    if (id.includes('RMA')) {
        let rmaIndex = order.rmas!.map(rma => rma.id).indexOf(id)
        let rmaItems = []
        for (let item of order.rmas![rmaIndex].items) {
            let pos = linnOrder.Items.map((item: { SKU: string; }) => item.SKU).indexOf(item.SKU)
            if (pos !== -1) {
                let details = {
                    "SKU": item.SKU,
                    "LocationId": "00000000-0000-0000-0000-000000000000",
                    "Level": 0 - item.QTY
                }
                rmaItems.push(details)
            }
        }
        return await linn.createRma(rmaItems)
    }

    if (id.includes('RTN')) {
        let returnIndex = order.returns!.map(rma => rma.id).indexOf(id)
        let returnItems = []
        for (let item of order.returns![returnIndex].items) {
            let pos = linnOrder.Items.map((item: { SKU: string; }) => item.SKU).indexOf(item.SKU)
            if (pos !== -1) {
                let details = {
                    "OrderItemRowId": linnOrder.Items[pos].RowId,
                    "RefundedUnit": 0,
                    "IsFreeText": false,
                    "FreeTextOrNote": order.returns![returnIndex].reason,
                    "Amount": order.returns![returnIndex].total,
                    "Quantity": item.QTY,
                    "ReasonTag": "Shop Return"
                }
                returnItems.push(details)
            }
        }
        return await linn.createReturn(order.linnid, returnItems)
    }

    return {status: 'done!'}
}

export const getItemsForSearch = async (query: { type: string, id: string }) => {
    let dbQuery
    let dbSort

    let dbProject: any = {
        "SKU": 1,
        "LINNID": 1,
        "EAN": 1,
        "TITLE": 1,
        "SHOPPRICEINCVAT": 1,
        "PURCHASEPRICE": 1,
        "STOCKTOTAL": 1
    }

    if (query.type === "TITLE") {
        dbQuery = {
            $and: [{
                $or: [{$text: {$search: query.id}}, {
                    TITLE: {
                        $regex: query.id,
                        $options: "i"
                    }
                }]
            }, {LISTINGVARIATION: {$eq: false}}, {TILLFILTER: {$ne: "true"}}]
        }
        dbProject.score = {$meta: "textScore"}
        dbSort = {score: {$meta: "textScore"}}
    } else {
        dbQuery = {
            $and: [{
                [query.type]: {
                    $regex: query.id,
                    $options: "i"
                }
            }, {LISTINGVARIATION: {$eq: false}}, {TILLFILTER: {$ne: "true"}}]
        }
        dbSort = {[query.type]: 1}
    }
    return await mongoI.find<item>("Items", dbQuery, dbProject, dbSort)
}

export const getItemForOrder = async (query: { type: string, id: string }) => {
    const dbQuery = query.type === "EAN"
        ? {[query.type]: {$regex: query.id, $options: "i"}}
        : {[query.type]: {$eq: query.id}};

    return await mongoI.findOne<item>("Items", dbQuery, {
        "SKU": 1,
        "LINNID": 1,
        "EAN": 1,
        "TITLE": 1,
        "QSPRICEINCVAT": 1,
        "SHOPPRICEINCVAT": 1,
        "PURCHASEPRICE": 1,
        "STOCKTOTAL": 1
    })
}

export const exportOrder = async (order: tillServer.order) => {
    return await mongoI.setData("Till-Export", {id: 1}, {id: 1, order: order})
}

export const importOrder = async () => {
    const result = await mongoI.findOne<{ id: number, order: tillServer.order }>("Till-Export", {id: 1})
    return result!.order
}

export const rewardCard = async (query: object, barcode: string) => {
    if (barcode.startsWith("QSGIFT")) {
        const result = await mongoI.findOne<giftCard>("Shop-Giftcard", query)
        if (result) {
            return (result)
        } else {
            let card = {id: barcode, active: false}
            await mongoI.setData("Shop-Giftcard", query, card)
            return (card);
        }
    }
}

export const updateRewardCard = async (card: giftCard) => {
    if (!card.id || card.id === "") return
    if (card.id.startsWith("QSGIFT")) {
        if (!card.amount) {
            card.active = false
            card.amount = 0
        } else {
            card.active = true
        }
        if (card._id) delete card._id
        return await mongoI.setData("Shop-Giftcard", {id: card.id}, card)
    }
}

export const cashUp = async () => {

    function createCashString(orders: tillServer.order[]) {
        let cashUp = []
        for (let order of orders) {
            if (order.transaction.type === "CASH" || order.transaction.type === "SPLIT") {
                let pos = cashUp.map(till => till.id).indexOf(order.till)
                let amount = 0
                if (order.transaction.type === "CASH") amount = parseFloat(order.transaction.amount ??= "0")
                if (order.transaction.type === "SPLIT") amount = order.transaction.cash ??= 0
                if (pos === -1) {
                    cashUp.push({id: order.till, total: amount})
                } else {
                    cashUp[pos].total += amount
                }
            }
        }
        cashUp.sort((a, b) => a.id > b.id ? 1 : b.id > a.id ? -1 : 0)
        return cashUp
    }

    let today = new Date()
    let todayQuery = {
        "transaction.date": {
            $gt: (today.setHours(3)).toString(),
            $lt: (today.setHours(22)).toString()
        }
    }
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    let yesterdayQuery = {
        "transaction.date": {
            $gt: (yesterday.setHours(3)).toString(),
            $lt: (yesterday.setHours(22)).toString()
        }
    }
    const todayOrders = await mongoI.find<tillServer.order>("Shop", todayQuery) as tillServer.order[]
    const yesterdayOrders = await mongoI.find<tillServer.order>("Shop", yesterdayQuery) as tillServer.order[]

    return {today: createCashString(todayOrders), yesterday: createCashString(yesterdayOrders)}
}