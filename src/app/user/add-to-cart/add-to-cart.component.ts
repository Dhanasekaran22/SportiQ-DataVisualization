import { Component, OnInit } from '@angular/core';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrl: './add-to-cart.component.css'
})
export class AddToCartComponent implements OnInit {

  constructor(
    private sportiQService: AppService
  ) { }

  // Current User Details
  currentUser: { name: string, email: string } = {
    name: '',
    email: ''
  }

  //store the current user cart items
  cartItems: any[] = [];

  //get the cart productDetails
  cartProductDetails: any[] = [];

  //Total prices
  totalSellingPrice = 0;
  totalDiscountedPrice = 0;
  finalTotal = 0;


  ngOnInit(): void {
    //to get the current user name and email
    this.currentUser = this.sportiQService.getUserData();
    this.loadCurrentUserCartItems();
  }


  //get the current user cart items
  loadCurrentUserCartItems() {

    if (!this.currentUser)
      return;

    //check the current user is logged in or not
    if (this.currentUser.email) {
      this.sportiQService.getCurrentUserCartItems(this.currentUser.email).subscribe({
        next: (dataInCart) => {
          this.cartItems = dataInCart;
          console.log("current user Cart Items", this.cartItems);

          this.loadCartProductDetails();

          console.log("in add to cart component set");

        },
        error: (error) => {
          alert("error on while fetching cart items");
          console.log("error on while fetching cart items", error);
        }
      });
    }
  }

  //get the cart product details 
  loadCartProductDetails() {
    if (this.cartItems.length > 0) {

      //Clearing old data before fetching new ones
      this.cartProductDetails = [];
      this.sportiQService.getCartProductDetails(this.cartItems).subscribe({
        next: (response) => {
          this.cartProductDetails = response.map((detail: any) => detail.data);
          console.log("cart product details: ", this.cartProductDetails);
          this.calculateTotals();
        },
        error: (error) => {
          alert("error on while fetching product details");
          console.log("error on while fetching product details", error);
        }
      });
    }
  }

  //calculate totals dynamically
  calculateTotals() {
    const totals = this.sportiQService.calculateTotals(this.cartItems, this.cartProductDetails);
    this.totalSellingPrice = totals.totalSellingPrice;
    this.totalDiscountedPrice = totals.totalDiscountedPrice;
    this.finalTotal = totals.finalTotal;
  }

  // delete the particular cart items 
  removeCartItem(item: any) {
    this.sportiQService.deleteCartItem(item._id, item._rev).subscribe({
      next: (response) => {
        this.loadCurrentUserCartItems();
        console.log("successfully deleted the cart item");
      },
      error: (error) => {
        alert("error on while deleting cart items");
        console.log("error on while deleting cart items", error);
      }
    });
  }

  updateCartQuantity(item: any) {

    const product = this.cartProductDetails.find(prod => prod.productName === item.data.productName);

    if (product) {
      //calculate discounted price dynamically
      item.data.discountedSellingPrice = product.discountedSellingPrice * item.data.quantity;
    }

    // Recalculate totals before saving
    this.calculateTotals();

    this.sportiQService.updateCartItems(item).subscribe({
      next: () => {
        console.log("Quantity updated in CouchDB")
        this.loadCurrentUserCartItems();
      },
      error: (error) => console.log("Error updating quantity in CouchDB", error),
    });
  }


  increaseQuantity(item: any) {
    item.data.quantity++;

    //get the stock of the product
    const productStock = this.cartProductDetails.find((dataInProductDetails: any) => dataInProductDetails.productName === item.data.productName).productStock;

    if (this.sportiQService.checkProductStock(item.data.quantity, productStock)) {
      item.data.quantity--;
    }
    else {
      this.updateCartQuantity(item);    // Updates both quantity & discounted price
    }
  }

  decreaseQuantity(item: any) {
    if (item.data.quantity > 1) {
      item.data.quantity--;
      this.updateCartQuantity(item);    // Updates both quantity & discounted price
    }
  }
}
