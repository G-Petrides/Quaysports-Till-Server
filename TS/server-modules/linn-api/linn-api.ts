import {postReq} from "./linn-post-req";

export const createNewOrder = async () => {
    return await postReq(
        '/api/Orders/CreateNewOrder',
        "fulfilmentCenter=bcee8b08-5fc5-4694-9400-4d489d977186&createAsDraft=false"
    )
}

export const addItemToOrder = async (item: string) => {
    return await postReq(
        '/api/Orders/AddOrderItem',
        item
    )
}

export const setOrderNotes = async (notes: string) => {
    return await postReq(
        '/api/Orders/SetOrderNotes',
        notes
    )
}

export const setOrderCustomerInfo = async (info: string) => {
    return await postReq(
        '/api/Orders/SetOrderCustomerInfo',
        info
    )
}

export const setOrderGeneralInfo = async (info: string) => {
    return await postReq(
        '/api/Orders/SetOrderGeneralInfo',
        info
    )
}

export const processOrder = async (id: string, loc: string) => {

    let linnLocation
    if (loc === "Default") linnLocation = "00000000-0000-0000-0000-000000000000"
    if (loc === "Shop") linnLocation = "bcee8b08-5fc5-4694-9400-4d489d977186"
    return await postReq(
        '/api/Orders/ProcessOrder',
        `orderId=${id}&scanPerformed=true&locationId=${linnLocation}&context={"Module": "Automatic Processing for ${loc}"}`
    )
}

export const getOrder = async (id: string) => {
    return await postReq(
        '/api/Orders/GetOrderById',
        `pkOrderId=${id}`
    )
}

export const createRma = async (arr: any) => {
    return await postReq(
        '//api/Stock/UpdateStockLevelsBySKU',
        `stockLevels=${JSON.stringify(arr)}&changeSource=Shop RMA - `
    )
}

export const createReturn = async (orderId: string, arr: any) => {
    let linnRma = {
        "ChannelInitiated": true,
        "OrderId": orderId,
        "RefundLines": arr,
    }
    return await postReq(
        '/api/ReturnsRefunds/CreateRefund',
        `request=${JSON.stringify(linnRma)}`
    )
}

