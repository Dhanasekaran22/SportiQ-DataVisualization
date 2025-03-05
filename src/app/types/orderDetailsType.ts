export interface OrderDetailsType{
    _id:string;
    _rev?:string;
    data:{
        cartId:string;
        orderId:string;
        type:string;
    };
}