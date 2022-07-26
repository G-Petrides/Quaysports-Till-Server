import {postReq} from "./linn-post-req";

export const getLinnChannelPrices = async (id: string) => {
    return await postReq(
        '/api/Inventory/GetInventoryItemPrices',
        'inventoryItemId=' + id
    )
}
export const getLinnSuppliers = async (id: string) => {
    return await postReq(
        '/api/Inventory/GetStockSupplierStat',
        ('inventoryItemId=' + id).replace(/"/g, '')
    )
}

export const getLinnQuery = async (query: string) => {
    return await postReq(
        '/api/Dashboards/ExecuteCustomScriptQuery',
        'script=' + encodeURIComponent(query.replace(/ +(?= )/g, ''))
    )
}

export const updateLinnItem = async (path: string, updateData: string) => {
    return await postReq(
        path,
        updateData
    )
}

export const updateItemImage = async (data: string) => {
    return await postReq(
        '/api/Inventory/AddImageToInventoryItem',
        `request=${encodeURIComponent(JSON.stringify(data))}`
    )
}

export const getLinnItemDesc = async (query: string) => {
    return await postReq(
        '/api/Inventory/GetInventoryItemDescriptions',
        ('inventoryItemId=' + query).replace(/"/g, '')
    )
}

export const getLinnChannelStatus = async (query: string) => {
    return await postReq(
        '/api/Inventory/GetInventoryItemChannelSKUs',
        ('inventoryItemId=' + query).replace(/"/g, '')
    )
}

export const getPostalServices = async () => {
    return await postReq(
        '/api/PostalServices/GetPostalServices',
        ''
    )
}

export const createTransfer = async () => {
    return await postReq(
        '/api/WarehouseTransfer/CreateTransferRequestWithReturn',
        'fromLocationId=1a692c39-afc9-4844-9f11-6e6625a9c1f1&toLocationId=00000000-0000-0000-0000-000000000000'
    )
}

export const checkTransfer = async () => {
    return await postReq(
        '/api/WarehouseTransfer/CheckForDraftTransfer',
        'toLocationId=00000000-0000-0000-0000-000000000000&fromLocationId=1a692c39-afc9-4844-9f11-6e6625a9c1f1'
    )
}

export const addItemToTransfer = async (tranId: string, itemId: string) => {
    return await postReq(
        '/api/WarehouseTransfer/AddItemToTransfer',
        ('fkTransferId=' + tranId + '&pkStockItemId=' + itemId).replace(/"/g, '')
    )
}

export const remItemFromTransfer = async (tranId: string, itemId: string) => {
    return await postReq(
        '/api/WarehouseTransfer/RemoveItemFromTransfer',
        ('pkTransferId=' + tranId + '&pkTransferItemId=' + itemId).replace(/"/g, '')
    )
}

export const changeItemTransferQty = async (tranId: string, itemId: string, qty: string) => {
    return await postReq(
        '/api/WarehouseTransfer/ChangeTransferItemRequestQuantity',
        ('pkTransferId=' + tranId + '&pkTransferItemId=' + itemId + '&Quantity=' + qty).replace(/"/g, '')
    )
}

export const getActiveTransfer = async (tranId: string) => {
    return await postReq(
        '/api/WarehouseTransfer/GetTransferWithItems',
        ('pkTransferId=' + tranId).replace(/"/g, '')
    )
}

export const completeTransfer = async (tranId: string) => {
    return await postReq(
        '/api/WarehouseTransfer/ChangeTransferStatus',
        'pkTransferId=' + tranId + '&newStatus=7'
    )
}

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

export const adjustStock = async (arr: any, id: string) => {
    return await postReq(
        '/api/Stock/UpdateStockLevelsBySKU',
        `stockLevels=${JSON.stringify(arr)}&changeSource=Shop StockIn - ${id}`
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

export const bulkGetImages = async (skus: any) => {
    return await postReq(
        '/api/Inventory/GetImagesInBulk',
        `request={"SKUS":${JSON.stringify(skus)}}`
    )
}
