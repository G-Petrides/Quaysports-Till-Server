import {postReq} from "./linn-post-req";

export const getLinnQuery = async (query: string) => {
    return await postReq(
        '/api/Dashboards/ExecuteCustomScriptQuery',
        'script=' + encodeURIComponent(query.replace(/ +(?= )/g, ''))
    )
}
export const adjustStock = async (arr: any, id: string) => {
    return await postReq(
        '/api/Stock/UpdateStockLevelsBySKU',
        `stockLevels=${encodeURIComponent(JSON.stringify(arr))}&changeSource=Shop Checkout Stock Change - ${id}`
    )
}