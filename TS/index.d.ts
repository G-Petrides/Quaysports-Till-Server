declare namespace schema {
    interface Image {
        id: string;
        url: string;
        filename: string;
        link: string;
    }

    interface ChannelData {
        year: number;
        source: string;
        quantity: number;
    }

    interface CompositeItems {
        title: string;
        SKU: string;
        quantity: number;
        purchasePrice: number;
        weight: number;
    }

    interface LinnExtendedProperty {
        epName: string;
        epType: string;
        epValue: string;
        pkRowId: string;
    }

    interface OnOrder {
        confirmed: boolean;
        due: string;
        id: string;
        quantity: number;
    }

    interface MappedExtendedProperties {
        amazonLatency: number
        COMISO2: string
        COMISO3: string
        tariffCode: string
        category1: string
        category2: string
        bulletPoint1: string
        bulletPoint2: string
        bulletPoint3: string
        bulletPoint4: string
        bulletPoint5: string
        searchTerm1: string
        searchTerm2: string
        searchTerm3: string
        searchTerm4: string
        searchTerm5: string
        amazonSport: string
        amazonDepartment: string
        tradePack: string
        specialPrice: string
        //used to be SHIPFORMAT, move to extended properties?
        shippingFormat: string
        //used to be TILLFILTER
        tillFilter: string
    }

    interface LegacyShipping {
        //used to be SHIPCOURIERSTD, remove?
        standard: string
        //used to be SHIPCOURIEREXP
        expedited: string
        //used to be SHIPEBAYSTD, remove?
        standardEbay: string
        //used to be SHIPAMAZONEXP, remove?
        expeditedAmazon: string
    }

    interface Prices {
        //used to be PURCHASEPRICE
        purchase: number
        //used to be RETAILPRICE
        retail: number
        //used to be AMZPRICEINCVAT
        amazon: number
        //used to be EBAYPRICEINCVAT
        ebay: number
        //used to be QSPRICEINCVAT
        magento: number
        //used to be SHOPPRICEINCVAT
        shop: number
    }

    interface ShelfLocation {
        prefix: string
        letter: string
        number: string
    }

    interface Discounts {
        shop: number
        magento: number
    }

    interface ChannelPrices {
        amazon: LinnChannelPriceData
        ebay: LinnChannelPriceData
        magento: LinnChannelPriceData
        shop: BaseChannelPriceData
    }

    interface BaseChannelPriceData {
        status: number,
        price: string
    }

    interface LinnChannelPriceData extends BaseChannelPriceData {
        subSource: string,
        updated: string,
        id: string,
        updateRequired: boolean
    }

    interface Stock {
        //renamed from yelland?
        default: number,
        warehouse: number
        //map from STOCKTOTAL
        total: number
        //map from MINSTOCK
        minimum: number
        //map from STOCKVAL
        value: number
        //map from INVCHECKDATE
    }

    export interface StockTake {
        checked?: boolean;
        date?: string | null;
        quantity?: number;
    }

    interface ChannelMarginData {
        fees: number;
        profit: number;
        profitLastYear: number;
        salesVAT: number;
    }

    interface AmazonMarginData extends ChannelMarginData {
        primeProfit: number
        primePostage: number
    }

    interface MarginData {
        amazon: AmazonMarginData
        ebay: ChannelMarginData
        magento: ChannelMarginData
        shop: ChannelMarginData
        packaging: number
        postage: number
        totalProfitLastYear: number
    }

    interface CheckboxStatus {
        stockForecast: StockForecastStatus
        done: DoneStatus
        ready: ReadyStatus
        notApplicable: NotApplicableStatus
        //map from AMZPRIME
        prime: boolean
        marginCalculator: MarginCalculatorStatus
    }

    interface StockForecastStatus {
        list: boolean
        hide: boolean
    }

    interface DoneStatus {
        goodsReceived: boolean
        addedToInventory: boolean
        EAN: boolean
        photos: boolean
        marginsCalculated: boolean
        jariloTemplate: boolean
        ebayDraft: boolean
        inventoryLinked: boolean
        ebay: boolean
        amazon: boolean
        magento: boolean
        zenTackle: boolean
        amazonStore: boolean
    }

    interface ReadyStatus {
        ebay: boolean
        amazon: boolean
        magento: boolean
        zenTackle: boolean
        amazonStore: boolean
    }

    interface NotApplicableStatus {
        ebay: boolean
        amazon: boolean
        magento: boolean
        zenTackle: boolean
        amazonStore: boolean
    }

    interface MarginCalculatorStatus {
        //map from MCOVERRIDES
        hide: boolean
        amazonOverride: boolean
        ebayOverride: boolean
        magentoOverride: boolean
    }

    interface Postage {
        // used to be POSTID?
        id: string
        //used to be POSTALPRICEUK
        price: number
        //used to be POSTMODID
        modifier: string
    }

    interface Packaging {
        lock: boolean,
        items: string[]
        editable: boolean
        //used to be PACKGROUP
        group: string
    }

    interface Images {
        main: Image,
        image1: Image,
        image2: Image,
        image3: Image,
        image4: Image,
        image5: Image,
        image6: Image,
        image7: Image,
        image8: Image,
        image9: Image,
        image10: Image,
        image11: Image
    }

    interface BrandLabel {
        image: string,
        path: string,
        brand: string
        title1: string,
        title2: string,
        location: string
    }

    interface Item {
        _id?: string
        EAN: string
        isComposite: boolean
        isListingVariation: boolean
        linnId: string
        SKU: string
        title: string
        webTitle: string
        weight: number
        supplier: string
        suppliers: string[]
        brand: string
        description: string
        shortDescription: string
        lastUpdate: string
        marginNote: string
        legacyShipping: LegacyShipping
        prices: Prices
        discounts: Discounts
        shelfLocation: ShelfLocation
        channelPrices: ChannelPrices
        stock: Stock
        stockTake: StockTake
        onOrder: OnOrder[]
        //used to be MD
        marginData: MarginData
        //used to be CD is it dynamically generated and still used?
        channelData: ChannelData[]
        //used to be CHECK
        checkboxStatus: CheckboxStatus
        //used to be IDBEP
        mappedExtendedProperties: MappedExtendedProperties
        compositeItems: CompositeItems[]
        extendedProperties: LinnExtendedProperty[]
        postage: Postage
        packaging: Packaging
        images: Images
        stockHistory: number[][]
        linkedSKUS: string[]
        //move items from IDBFILTER into tags
        tags: string[]
        brandLabel: BrandLabel
    }
}

export namespace till {
    export interface Order {
        _id?: string,
        address: {
            email: string,
            number: string,
            phone: string,
            postcode: string
        },
        discountReason: string,
        flatDiscount: number,
        giftCardDiscount: number,
        grandTotal: number,
        id: string,
        linnstatus: {
            Error: string,
            Message: string,
            OrderId: string,
            Processed: string
        },
        items: OrderItem[],
        paid: boolean,
        percentageDiscount: number,
        percentageDiscountAmount: number,
        processedBy: string,
        returns: OrderReturn[],
        till: string,
        total: number,
        profit: number,
        profitWithLoss: number,
        transaction: OrderTransaction
    }

    export interface OrderItem {
        _id: string,
        EAN: string,
        isReturned: boolean,
        isTrade: boolean,
        linnId: string,
        prices: {
            purchase: number
            retail: number
            amazon: number
            ebay: number
            magento: number
            shop: number
        },
        discounts: {
            shop: number
            magento: number
        }
        quantity: number,
        returnQuantity: number,
        totalReturned?: number,
        SKU: string,
        stock: {
            default: number,
            warehouse: number
            total: number
            minimum: number
            value: number
        },
        shelfLocation:schema.ShelfLocation,
        title: string,
        total: number,
        profitCalculated:boolean
    }

    export interface OrderTransaction {
        amount: number,
        authCode: string,
        bank: string,
        cash: number,
        change: number,
        date: string,
        flatDiscount: number,
        giftCard: number,
        mask: string,
        type: string
    }

    export interface OrderReturn {
        date: string,
        id: string,
        reason: string,
        total: number,
        items: OrderItem[]
        transaction: Pick<OrderTransaction, "amount" | "date" | "mask" | "type">
        user: string
    }

    export interface OrderRma{
        date: string,
        id: string,
        reason: string,
        items: OrderItem[]
        user: string
    }

}