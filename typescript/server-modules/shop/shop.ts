import {schema, till} from "../../index";
import {UpdateResult} from "mongodb";
import {find, findAggregate, findOne, setData} from "../mongo-interface/mongo-interface";
import {adjustLinnStock, getLinnQuery} from "../linn-api/linn-api";

type item = Pick<schema.Item, "SKU" | "linnId" | "EAN" | "title" | "prices" | "stock">

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
    return await find<till.Order>("Till-Transactions", query)
}

export const getQuickLinks = async ()=>{
    const query = [
        {
            '$match': {}
        }, {
            '$lookup': {
                'from': 'New-Items',
                'let': {
                    'sku': '$links'
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
                            'prices': 1,
                            'title': 1,
                            'till':1
                        }
                    },
                    {
                        '$sort': {
                            'SKU': 1
                        }
                    }
                ],
                'as': 'data'
            }
        }
    ]
    interface QuickLinks { _id:string, id:string, links:QuickLinkItem[], data:QuickLinkItem[] }
    type QuickLinkItem = Pick<schema.Item, "SKU" | "title" | "prices" | "till">

    return await findAggregate<QuickLinks>("Till-QuickLinks", query)
}

export const count = async () => {
    let result = await findOne<till.Order>("Till-Transactions", {}, {}, {_id: -1}, 1)
    return result ? Number(result.id.substring(6, result.id.length)) + 1 : 1;
}

export const update = async (order: till.Order): Promise<UpdateResult | undefined> => {
    if (order._id !== undefined) delete order._id
    if (order.paid && (!order.returns || order.returns.length === 0)) {
        await calculateProfit(order)
        await adjustStock(order)
    }

    return await setData("Till-Transactions", {id: order.id}, order)
}

const calculateProfit = async (order: till.Order) => {

    let skus = order.items.map(item => item.SKU)

    let dbItems = await find<Pick<schema.Item, "SKU" | "marginData">>(
        "New-Items",
        {SKU: {$in: skus}},
        {SKU: 1, marginData: 1}
    )
    if(!dbItems) return

    if(!order.profit) order.profit = 0
    if(!order.profitWithLoss) order.profitWithLoss = 0

    for(let item of order.items){
        let dbItem = dbItems.find(findItem => findItem.SKU === item.SKU)
        if(!dbItem) {
            item.profitCalculated = false
            continue
        }
        order.profit += Math.round(dbItem.marginData.shop.profit)
        item.profitCalculated = true
    }
    order.profitWithLoss += Math.round(order.profit - (order.percentageDiscountAmount + order.flatDiscount))
}

export const adjustStock = async (order: till.Order) => {
    let stockData = []

    let skuSet = new Set(order.items.map(item => item.SKU))
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
    let stockLevels = JSON.parse(await getLinnQuery(query)).Results as stockReport[]
    let stockMap = new Map(stockLevels!.map(info => [info.SKU, parseInt(info.QTY)]))


    for (let item of order.items) {
        let details = null

        if (!stockMap.has(item.SKU)) continue;
        details = {
            "SKU": item.SKU,
            "LocationId": "00000000-0000-0000-0000-000000000000",
            "Level": -item.quantity
        }

        if ((stockMap.get(item.SKU)! -item.quantity) <= 0) {
            let stockError: stockError = {
                CHECKED: false,
                PRIORITY: true,
                QTY: 0,
                SKU: item.SKU,
                TITLE: item.title
            }
            if ((stockMap.get(item.SKU)! - item.quantity) === 0) stockError.PRIORITY = false
            await setData("Shop-Stock-Report", {SKU: item.SKU}, stockError)
        }

        if (details) stockData.push(details)
    }

    const processResult = JSON.parse(await adjustLinnStock(stockData, order.id))

    let processed = true
    let processedMsg = ""
    for (let result of processResult) {
        processedMsg = result.LastUpdateOperation
        if (result.PendingUpdate) processed = false
    }

    order.linnstatus = {
        Error:"",
        Message: processedMsg,
        OrderId: order.id,
        Processed: processed.toString()
    }
}

export const postcodes = async (id: string) => {

    const result = await find<till.Order>("Till-Transactions", {"address.postcode": {$regex: id, $options: "i"}},
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
    return await find<any>("Till-Transactions", {"id": {$regex: id, $options: "i"}})
}

export const mask = async (id: string) => {
    return await find<any>("Till-Transactions", {"transaction.mask": {$regex: id, $options: "i"}})
}

export const lastFifty = async () => {
    return await find<any>("Till-Transactions", {}, {}, {$natural: -1}, 50)
}

export const getItemsForSearch = async (query: { type: string, id: string }) => {
    let dbQuery
    let dbSort

    let dbProject: any = {
        "SKU": 1,
        "linnId": 1,
        "EAN": 1,
        "title": 1,
        "prices": 1,
        "stock": 1,
        "discounts": 1,
        "shelfLocation": 1
    }

    if (query.type === "TITLE") {
        dbQuery = {
            $and: [{
                $or: [{$text: {$search: query.id}}, {
                    title: {
                        $regex: query.id,
                        $options: "i"
                    }
                }]
            }, {isListingVariation: {$eq: false}}, {tags: {$nin: ["filtered", "till filter"]}}]
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
            }, {isListingVariation: {$eq: false}}, {tags: {$nin: ["filtered", "till filter"]}}]
        }
        dbSort = {[query.type]: 1}
    }

    return await find<schema.Item>("New-Items", dbQuery, dbProject, dbSort)
}

export const getItemForOrder = async (query: { type: string, id: string }) => {
    const dbQuery = query.type === "EAN"
        ? {[query.type]: {$regex: query.id, $options: "i"}}
        : {[query.type]: {$eq: query.id}};

    return await findOne<item>("New-Items", dbQuery, {
        "SKU": 1,
        "linnId": 1,
        "EAN": 1,
        "title": 1,
        "prices": 1,
        "stock": 1,
        "discounts": 1,
        "shelfLocation": 1
    })
}

export const exportOrder = async (order: till.Order) => {
    return await setData("Till-Export", {id: 1}, {id: 1, order: order})
}

export const importOrder = async () => {
    const result = await findOne<{ id: number, order: till.Order }>("Till-Export", {id: 1})
    return result!.order
}

export const rewardCard = async (query: object, barcode: string) => {
    if (barcode.startsWith("QSGIFT")) {
        const result = await findOne<giftCard>("New-Giftcards", query)
        if (result) {
            return (result)
        } else {
            let card = {id: barcode, active: false}
            await setData("New-Giftcards", query, card)
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
        return await setData("New-Giftcards", {id: card.id}, card)
    }
}

export const cashUp = async () => {

    function createCashString(orders: till.Order[]) {
        let cashUp = []
        for (let order of orders) {
            if (order.transaction.type === "CASH" || order.transaction.type === "SPLIT") {
                let pos = cashUp.map(till => till.id).indexOf(order.till)
                let amount = 0
                if (order.transaction.type === "CASH") amount = order.transaction.amount ??= 0
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
    const todayOrders = await find<till.Order>("Till-Transactions", todayQuery) as till.Order[]
    const yesterdayOrders = await find<till.Order>("Till-Transactions", yesterdayQuery) as till.Order[]

    return {today: createCashString(todayOrders), yesterday: createCashString(yesterdayOrders)}
}