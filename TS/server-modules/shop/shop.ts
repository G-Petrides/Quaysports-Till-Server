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

export const get = async (query: object) => {
    return await mongoI.find<tillServer.order>("Shop", query)
}

export const count = async () => {
    let result = await mongoI.findOne<tillServer.order>("Shop", {}, {}, {_id: 1}, 1)
    return result ? Number(result.id.substring(6, result.id.length)) + 1 : 1;
}

export const update = async (order: tillServer.order, loc = "Shop") => {
    if (order._id !== undefined) delete order._id
    if (order.paid === 'true') await linnOrder(order, loc)
    return await mongoI.setData("Shop", {id: order.id}, order)
}

export const linnOrder = async (order: tillServer.order, loc = "Default") => {

    const linnLocation = new Map([
        ["Default", "00000000-0000-0000-0000-000000000000"],
        ["Shop", "bcee8b08-5fc5-4694-9400-4d489d977186"]
    ])
    let date = new Date()

    let itemsCheck = false
    for (let item of order.order) {
        if (item.LINNID && item.LINNID !== "") {
            itemsCheck = true
        }
    }

    if (!order.linnid && itemsCheck) {
        const newOrder = JSON.parse(await linn.createNewOrder())

        for (let item of order.order) {
            if (item.LINNID && item.LINNID !== "") {
                let details = {"PricePerUnit": item.PRICE, "TaxInclusive": true}
                let string = `orderId=${newOrder.OrderId}&itemId=${item.LINNID}&channelSKU=${item.SKU}&fulfilmentCenter=${linnLocation.get(loc)}&quantity=${item.QTY}&linePricing=${JSON.stringify(details)}`
                await linn.addItemToOrder(string)
            }
        }

        let noteData = {
            "OrderId": newOrder.OrderId,
            "NoteDate": date,
            "Internal": true,
            "Note": "Shop Order: " + order.id,
            "CreatedBy": "Shop"
        }
        await linn.setOrderNotes(`orderId=${newOrder.OrderId}&orderNotes=[${JSON.stringify(noteData)}]`)

        let addressInfo = {
            ChannelBuyerName: order.id,
            Address: {
                FullName: order.id,
                Company: "",
                Address1: order.address?.number ? order.address.number : "Unit 13",
                Address2: "",
                Address3: "",
                Town: "",
                Region: "",
                PostCode: order.address?.postcode ? order.address.postcode : "EX31 3NJ",
                Country: "United Kingdom",
                PhoneNumber: order.address?.phone ? order.address.phone : "",
                EmailAddress: order.address?.email ? order.address.email : ""
            },
            BillingAddress: {
                FullName: order.id,
                Company: "",
                Address1: order.address?.number ? order.address.number : "Unit 13",
                Address2: "",
                Address3: "",
                Town: "",
                Region: "",
                PostCode: order.address?.postcode ? order.address.postcode : "EX31 3NJ",
                Country: "United Kingdom",
                PhoneNumber: order.address?.phone ? order.address.phone : "",
                EmailAddress: order.address?.email ? order.address.email : ""
            }
        }
        await linn.setOrderCustomerInfo(`orderId=${newOrder.OrderId}&info=${JSON.stringify(addressInfo)}&saveToCrm=false`)

        let generalInfo = {
            "Status": 1,
            "LabelPrinted": true,
            "InvoicePrinted": true,
            "IsRuleRun": true,
            "IsParked": false,
            "Identifiers": [
                {
                    "IdentifierId": 1,
                    "IsCustom": true,
                    "Tag": order.id,
                    "Name": "Order ID"
                }
            ],
            "ReferenceNum": order.id,
            "ExternalReferenceNum": order.id,
            "ReceivedDate": date,
            "Source": "Shop",
            "SubSource": "Quaysports",
            "DespatchByDate": date,
            "HasScheduledDelivery": false,
            "Location": linnLocation.get(loc),
        }
        await linn.setOrderGeneralInfo(`orderId=${newOrder.OrderId}&info=${JSON.stringify(generalInfo)}&wasDraft=false`)

        const processResult = JSON.parse(await linn.processOrder(newOrder.OrderId, loc))

        order.linnid = newOrder.OrderId

        if (processResult.Processed === true) {
            order.linnstatus = processResult
            await mongoI.setData("Shop", {id: order.id}, order)
        } else {
            order.linnstatus = JSON.parse(await linn.processOrder(newOrder.OrderId, "Default"))
            await mongoI.setData("Shop", {id: order.id}, order)
        }

    } else {
        console.log("Linn order exists!")
    }
}

export const postcodes = async (id: string) => {

    const result = await mongoI.find<tillServer.order>("Shop", {"address.postcode": {$regex: id, $options: "i"}},
        {address: 1})

    let combine: { postcode: string, numbers: string[] }[] = []
    if (result) {
        for (let v of result) {
            let pos = combine.map( address => address.postcode).indexOf(v.address.postcode)
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

// Till order transfer

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
                let pos = cashUp.map( till => till.id ).indexOf( order.till )
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
