import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { OrderType } from '../../types/orderType';
import { OrderDetailsType } from '../../types/orderDetailsType';
import { ResponseType } from '../../types/responseType';
import { Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.css'
})
export class OrderSummaryComponent implements OnInit {

  constructor(
    private sportiQService: AppService,
    private router: Router) { }

  //for the current user details
  currentUser: { name: string, email: string }
    = { name: '', email: '' }

  newAddress = {
    email: '',
    address: '',
    city: '',
    state: '',
    phoneNo: null,
    isActive: null,
    type: 'address'
  }

  //for storing the current user address
  userAddresses: any[] = [];

  selectedAddress: any;

  //for storing the cart products and product details
  cartItems: any[] = [];
  cartProductDetails: any[] = [];

  //calculate price
  totalSellingPrice = 0;
  totalDiscountedPrice = 0;
  finalTotal = 0;

  //show the address form
  showNewAddressForm = false;

  ngOnInit(): void {
    this.currentUser = this.sportiQService.getUserData();
    this.newAddress.email = this.currentUser.email;
    this.loadCurrentUserCartItems();
    this.loadUserAddress();
  }


  //get the current user cart items
  loadCurrentUserCartItems() {

    if (!this.currentUser.email)
      return;

    this.sportiQService.getCurrentUserCartItems(this.currentUser.email).subscribe({
      next: (response) => {
        console.log("current user cart items", response);
        this.cartItems = response;

        this.loadCartProductDetails();
      },
      error: (error) => {
        alert("error on while fetching cart items")
        console.log("error on while fetching cart items", error);
      }
    });


  }

  //get the cart product details
  loadCartProductDetails() {
    if (!this.cartItems.length)
      return;

    this.sportiQService.getCartProductDetails(this.cartItems).subscribe({
      next: (response) => {
        console.log("cart product details", response);
        this.cartProductDetails = response.map((detail) => detail);
        this.calculateTotals();
      },
      error: (error) => {
        alert("error on while fetching cart product details");
        console.log("error on while fetching cart product details", error);
      }
    });

  }




  //calculate the total price of the summary
  calculateTotals() {

    const cart_product_details = this.cartProductDetails.map((detail: any) => detail.data)
    const totals = this.sportiQService.calculateTotals(this.cartItems, cart_product_details);
    this.totalSellingPrice = totals.totalSellingPrice;
    this.totalDiscountedPrice = totals.totalDiscountedPrice;
    this.finalTotal = totals.finalTotal;
  }

  //get the current user Address
  loadUserAddress() {
    if (!this.currentUser.email)
      return

    this.sportiQService.getUserAddresses(this.currentUser.email).subscribe({
      next: (response) => {
        if (response.rows.length > 0) {
          this.userAddresses = response.rows.map((row: any) => row.doc);

          // If no active address, set the first address as active
          if (!this.userAddresses.some(addr => addr.data.isActive)) {
            this.userAddresses[0].data.isActive = true;
            this.selectedAddress = this.userAddresses[0];
          }
          else {

            // No need for "== true" as isActive is already a boolean.
            this.selectedAddress = this.userAddresses.find(addr => addr.data.isActive === true) || null;
          }
          console.log("user Address: ", this.userAddresses);
        }
        else {
          alert("No address found. Please add a delivery address");
        }
      },
      error: (error) => {
        alert("Error on while fetching Addresses");
        console.log("Error on while fetching Addresses", error);
      }
    })


  }

  //to select the active address
  selectAddress(address: any) {
    console.log("selected address", address);

    this.selectedAddress = address;

    // Mark all addresses as inactive
    this.userAddresses.forEach(addr => addr.data.isActive = false);

    //set only the selected address is active
    address.data.isActive = true;

    //prepare bulk update request for couchDB
    const updateAddresses = this.userAddresses.map(addr => ({
      _id: addr._id,
      _rev: addr._rev,
      data: {
        ...addr.data,
        isActive: addr === address   // Ensures only selected address is active
      }
    }));

    this.sportiQService.updateAndCreateBulkItems(updateAddresses).subscribe({
      next: (response) => {
        this.loadUserAddress();
        console.log("bulk Addresses updated successfully ");
      },
      error: (error) => {
        alert("error on while updating bulk addresses");
        console.log("error on while updating bulk addresses", error);
      }
    });
  }

  //open the new address form
  openNewAddressForm() {
    this.showNewAddressForm = true;
  }

  //add a new address
  addNewAddress() {
    if (!this.newAddress.address || !this.newAddress.city || !this.newAddress.state || !this.newAddress.phoneNo) {
      alert("please fill all address details")
      return;
    }

    const newAddressData = {
      ...this.newAddress,
      isActive: this.userAddresses.length === 0  // First address should be active by default
    }

    this.sportiQService.addUserAddress(newAddressData).subscribe({
      next: (response) => {
        console.log("New Address Added successfully");
        this.showNewAddressForm = false;
        this.resetForm();
        this.loadUserAddress();
      },
      error: (error) => {
        alert("error on while adding the new address");
        console.log("error on while adding the new address", error);
      }
    });

  }

  //purchase the products
  placeOrder() {

    if (!this.selectedAddress) {
      alert("please select an address");
      return;
    }

    if (this.cartItems.length > 0) {

      //step 1: create Order Header(order view)
      const orderData: OrderType = {
        _id: `order_2_${uuidv4()}`,
        data: {
          customerAddressId: this.selectedAddress._id,
          totalPrice: this.finalTotal,
          orderStatus: "pending",
          orderDate: new Date().toISOString().split('T')[0],
          orderAt: this.getCurrentTime(),
          type: "order"
        }
      };

      this.sportiQService.createOrder(orderData).subscribe({
        next: (orderResponse: ResponseType) => {
          console.log("order header created", orderResponse);

          //step 2: prepare for order line Items (orderDetails)
          const orderId = orderResponse.id;
          const orderDetailsList: OrderDetailsType[] = this.cartItems.map(cartItem => ({
            _id: `orderdetail_2_${uuidv4()}`,
            data: {
              cartId: cartItem._id,
              orderId: orderId,
              type: "orderDetail"
            }
          }));
          this.createOrderDetails(orderDetailsList);
        },
        error: (error) => {
          alert("error on while placing order");
          console.log("error on while creating order header", error);

        }
      })
    }
    else {
      alert("No items in the cart")
    }


  }

  //step 2: create order Line Items
  createOrderDetails(orderDetailsList: OrderDetailsType[]) {
    this.sportiQService.updateAndCreateBulkItems(orderDetailsList).subscribe({
      next: (response) => {
        console.log("order details created (Line)");

        //step 3: update cart items to purchased
        this.updateCartStatus();

        //step 4: reduce the stock in the product view
        this.reduceStock();
      },
      error: (error) => {
        alert("error on while creating order details");
        console.log("error on while creating order details", error);
      }
    });
  }

  // Step 3: Update Cart Status
  updateCartStatus() {
    const updatedCartItems = this.cartItems.map(item => ({
      ...item,
      data: {
        ...item.data,
        cartStatus: "purchased"
      }
    }));

    this.sportiQService.updateAndCreateBulkItems(updatedCartItems).subscribe({
      next: (response) => {
        this.loadCurrentUserCartItems();
        this.router.navigate(['/payment-success'])
      },
      error: (error) => {
        alert("error on while updating order placed");
        console.log("error on updating while order placed");

      }
    });
  }

  //step 4 reduce the product Stocks in product view
  reduceStock() {
    const updatedProductStocks = this.cartProductDetails.map((productDetail) => {

      //find the product detail for the product stock
      const cartItem = this.cartItems.find((item) => item.data.productName === productDetail.data.productName);

      if (cartItem) {
        const updatedStock = productDetail.data.productStock - cartItem.data.quantity;
        console.log("updated stock", updatedStock);

        return {
          ...productDetail,
          data: {
            ...productDetail.data,
            productStock: updatedStock
          },
        };
      }
      return productDetail;
    });

    //update the product stocks on every ordered products
    this.sportiQService.updateAndCreateBulkItems(updatedProductStocks).subscribe({
      next: (response) => {
        console.log("product stock updated successfully", response);
      },
      error: (error) => {
        alert("Error while updating product stock");
        console.log("Error while updating product stock", error);
      },
    });
  }

  getCurrentTime(): string {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const amPm = hours >= 12 ? 'AM' : 'PM';
    hours = hours % 12 || 12; //convert 24 hour to 12 hour format
    return `${hours}:${minutes.toString().padStart(2, '0')} ${amPm}`
  }

  //reset the form
  resetForm() {
    this.newAddress = {
      email: '',
      address: '',
      city: '',
      state: '',
      phoneNo: null,
      isActive: null,
      type: 'address'
    }
  }

}
