export interface AddressType {
    _id: string;
    _rev?: string;
    data: {
        email: string;
        address: string;
        city: string;
        state: string;
        phoneNo: number | null;
        date:Date,
        isActive: boolean | null;
        type: string
    }
}