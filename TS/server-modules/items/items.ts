import mongoI = require('../mongo-interface/mongo-interface')

export const getImages = async (sku:string, type:string) => {
    interface itemImageDetails {
        _id:string,
        IMAGES:{
            [key:string]:{link:string, filename:string}
        }
    }
    const item = await mongoI.findOne<itemImageDetails>("Items", {SKU: sku}, {IMAGES: 1})
    if (!item) return
    if (!item.IMAGES || item.IMAGES === {}) return
    if (type) {
        let path = item.IMAGES[type].link ? "/images/" + item.IMAGES[type].link + "/" : "/images/" + sku + "/"
        return path + item.IMAGES[type].filename
    } else {
        let arr = []
        for (let i in item.IMAGES) {
            let path = item.IMAGES[i]?.link ? "/images/" + item.IMAGES[i].link + "/" : "/images/" + sku + "/"
            arr.push(path + item.IMAGES[i].filename)
        }
        return arr
    }
}

