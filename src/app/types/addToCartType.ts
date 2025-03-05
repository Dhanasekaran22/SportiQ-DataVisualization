export interface AddToCartType {

    email: string,
    productName: string,
    quantity: number,
    discountedSellingPrice: number,
    cartStatus: "purchased"|"not purchased",
    type: string

}