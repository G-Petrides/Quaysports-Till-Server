import mongoI = require('../mongo-interface/mongo-interface')
import {schema} from "../../index";

export const getImages = async (sku:string, type:keyof schema.Images) => {
    interface itemImageDetails {
        _id:string,
        images:schema.Images
    }
    const item = await mongoI.findOne<itemImageDetails>("New-Items", {SKU: sku}, {images: 1})
    if (!item || !item.images || !item.images[type]) return
    if (type) {
        let path = item.images[type].link ? "/images/" + item.images[type].link + "/" : "/images/" + sku + "/"
        return path + item.images[type].filename
    }
}