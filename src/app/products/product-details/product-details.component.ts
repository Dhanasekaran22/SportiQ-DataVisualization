import { Component, OnInit } from '@angular/core';
import { ProductDataService } from '../../service/product-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../service/authentication.service';
import { AddToCartType } from '../../types/addToCartType';
import { CheckOutService } from '../../service/check-out.service';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  constructor(
    private sportiQService:AppService,
    private route: ActivatedRoute,
    private router: Router) { }

  // to get the current user name and email
  loggedUserDetails: { name: string, email: string } =
    {
      name: "",
      email: ""
    }

  // store the selected product details
  productDetails: any;

  quantity: number = 1;

  ngOnInit(): void {
    this.getLoggedUserDetails();
    this.route.params.subscribe(params => {
      const productName = params['productName'].replace(/-/g, ' '); // replace '-' to space
      console.log("product name", productName);
      this.loadProductDetails(productName);
    });
  }

  loadProductDetails(productName: string) {
    this.sportiQService.getProductsByProductName(productName).subscribe({
      next: (response) => {
        this.productDetails = response.rows[0].doc.data
        console.log("Selected product details: ", this.productDetails);
      },
      error: (error) => {
        alert("Error on while fetching the selected product details");
        console.log("Error on while fetching the selected product details", error);
      }
    });
  }

  //didn't pass the parameter, we take the data from product details 
  addToCart() {
    if (!this.loggedUserDetails) {
      alert("Please login to adding items to cart")
      this.router.navigate(['/login']);
      return;
    }

    //check the adding item already exist in the cart
    this.sportiQService.getCurrentUserCartItems(this.loggedUserDetails.email).subscribe({
      next: (response) => {

        let existingCartItem = response.find((item: any) =>
          item.data.productName === this.productDetails.productName);
        console.log("existing cart item ", existingCartItem);

        let existingQuantityInCart = existingCartItem?.data?.quantity || 0;
        let newTotalQuantity = existingQuantityInCart + this.quantity;

        //check the stock availability
        if (newTotalQuantity > this.productDetails.productStock) {
          alert(`Only ${this.productDetails.productStock} available. You already have ${existingQuantityInCart} in your cart.`);
          return;
        }


        if (existingCartItem) {

          // Update the quantity of the existing item
          // const updatedQuantity = existingCartItem.data.quantity + this.quantity;

          //prepare the updated cart item
          const updatedCartData = {
            _id: existingCartItem._id,
            _rev: existingCartItem._rev,
            data: {
              ...existingCartItem.data,
              quantity: newTotalQuantity,
              discountedSellingPrice: this.productDetails.discountedSellingPrice * newTotalQuantity,
            }
          };

          console.log("updated Cart data", updatedCartData);

          //update the cart with new quantity
          this.sportiQService.updateCartItems(updatedCartData).subscribe({
            next: () => {
              alert(`${existingCartItem.data.productName} 's quantity updated `);
            },
            error: (error) => {
              console.log("Error while updating cart", error);
              alert("Error while updating cart");
            }
          });
        }

        else {

          // Add new item to cart
          const cartData: AddToCartType = {
            email: this.loggedUserDetails.email,
            productName: this.productDetails.productName,
            quantity: this.quantity,
            discountedSellingPrice: this.productDetails.discountedSellingPrice * this.quantity,
            cartStatus: "not purchased",
            type: 'add-to-cart'
          }
          this.sportiQService.addToCart(cartData).subscribe({
            next: (response) => {

              alert("added to cart successfully");
            },
            error: (error) => {
              console.log("error on while adding to cart");
              alert("error on while adding to cart");
            }
          })
        }
      },
      error: (error) => {
        console.log("error on while fetching cart items", error);
        alert("error on while fetching cart items");
      }
    });
  }





  getLoggedUserDetails() {
    this.loggedUserDetails = this.sportiQService.getUserData();
    console.log("Logged user Details: ", this.loggedUserDetails);
  }

  increaseQuantity() {
    this.quantity++;
    if (this.sportiQService.checkProductStock(this.quantity, this.productDetails.productStock)) {
      this.quantity--;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1)
      this.quantity--;
  }
}
