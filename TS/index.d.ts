export namespace  tillServer {
    export interface order {
        _id?:string,
        address?: {
            email?:string,
            number?:string,
            phone?:string,
            postcode?:string
        },
        discountReason?:string,
        flatDiscount:string,
        giftCardDiscount?:string,
        grandTotal:string,
        id:string,
        linnid?:string,
        linnstatus?:{
            Message?:string,
            OrderId?:string,
            Processed?:string
        },
        order: orderItem[],
        paid:string,
        perDiscount:string,
        perDiscountAmount:string,
        processedBy:string,
        returns?:{
            date:string,
            id:string,
            reason?:string,
            total?:string,
            items: orderItem[]
        }[],
        rmas?:{
            date:string,
            id:string,
            reason?:string,
            items: orderItem[]
        }[],
        till:string,
        total:string,
        transaction: orderTransaction
    }

    export interface orderItem {
        _id:string,
        EAN?:string,
        isReturned?:boolean,
        isTrade?:boolean,
        LINNID?:string,
        PRICE:number,
        PURCHASEPRICE?:number,
        QSPRICEINCVAT?:number,
        QTY:number,
        returnQty?:number,
        setQty?:boolean,
        SHOPPRICEINCVAT?:number,
        SKU:string,
        STOCKTOTAL?:number,
        TITLE?:string,
        TOTAL:number
    }

    export interface orderTransaction {
            amount?: string,
            authCode?: string,
            bank?: string,
            cash?: number,
            change?: number,
            date?: string,
            flatDiscount?: number,
            giftCard?: number,
            mask?: string,
            type?: string
    }

}