import {postReq} from "./linn-post-req";

export const getLinnQuery = async (query: string) => {
    return await postReq(
        '/api/Dashboards/ExecuteCustomScriptQuery',
        'script=' + encodeURIComponent(query.replace(/ +(?= )/g, ''))
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
export const adjustStock = async (arr: any, id: string) => {
    return await postReq(
        '/api/Stock/UpdateStockLevelsBySKU',
        `stockLevels=${JSON.stringify(arr)}&changeSource=Shop Checkout Stock Change - ${id}`
    )
}
