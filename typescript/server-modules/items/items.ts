import {schema} from "../../index";
import {findOne} from "../mongo-interface/mongo-interface";

export const getImages = async (sku:string, type:keyof schema.Images) => {
    interface itemImageDetails {
        _id:string,
        images:schema.Images
    }
    const item = await findOne<itemImageDetails>("New-Items", {SKU: sku}, {images: 1})
    if (!item || !item.images || !item.images[type]) return
    if (type) {
        let path = item.images[type].link ? "/images/" + item.images[type].link + "/" : "/images/" + sku + "/"
        return path + item.images[type].filename
    }
}