export interface OrderType {
    _id:string,
    _rev?:string,
    data:{
        customerAddressId:string,
        totalPrice:number,
        orderStatus:"pending"|"delivered",
        orderDate:string,
        orderAt:string,
        type:string
    }
}