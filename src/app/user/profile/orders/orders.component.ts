import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../service/app.service';
import { forkJoin } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  purchasedCartItems: any[] = []; // Store purchased cart items
  loggedUser: { name: string, email: string } = { name: '', email: '' };
  orderLine: any[] = []; // Store order IDs
  currentUserOrders: any[] = []; // Store current user orders
  productDetails: any[] = [];  //store the purchased product image urls

  displayPurchasedProducts: any[] = [];

  //feedback for the product
  stars = new Array(5); // Creates an array for 5 stars
  isReviewDialogOpen = false;
  selectedRating = 0;
  reviewText = '';
  currentOrder: any = null;
  ratingError: boolean = false;
  feedbackError: boolean = false;

  reviewedProducts: Set<string> = new Set(); // Ensure it is always initialized

  constructor(private sportiQService: AppService) { }

  ngOnInit(): void {
    this.loggedUser = this.sportiQService.getUserData();
    console.log("Current user:", this.loggedUser);

    if (this.loggedUser.email) {
      this.loadPurchasedCartItems();
      this.loadReviewProducts();
    }
  }

  /** Load purchased cart items for the current user */
  private loadPurchasedCartItems(): void {
    this.sportiQService.getCurrentUserPurchasedCartItems(this.loggedUser.email).subscribe({
      next: (cartResponse) => {
        this.purchasedCartItems = cartResponse || [];
        console.log("Purchased cart items:", this.purchasedCartItems);
        this.loadCurrentUserOrderDetails();
        this.getImagesForOrderedProducts();
      },
      error: (error) => this.handleError("Error fetching purchased cart items", error)
    });
  }

  /** Load order details (order line) based on purchased cart items */
  private loadCurrentUserOrderDetails(): void {
    if (this.purchasedCartItems.length === 0) return;

    const requests = this.purchasedCartItems.map((item: any) =>
      this.sportiQService.getCurrentUserOrderDetails(item._id)
    );
    // console.log(requests);


    forkJoin(requests).subscribe({
      next: (responses) => {
        this.orderLine = responses.map((orderDetailResponse) => orderDetailResponse.rows[0].doc)
        console.log("Order Line:", this.orderLine);
        this.loadCurrentUserOrders();
      },
      error: (error) => this.handleError("Error fetching order details", error)
    });
  }

  // Load order headers based on collected order IDs 
  private loadCurrentUserOrders(): void {
    if (this.orderLine.length === 0) return;

    const orderId = this.orderLine.map((order_line: any) => order_line.data.orderId)
    // console.log("order id",orderId);

    const requests = orderId.map(order_id =>
      this.sportiQService.getCurrentUserOrder(order_id)
    );

    forkJoin(requests).subscribe({
      next: (orderResponses) => {
        this.currentUserOrders = orderResponses;
        console.log("order head (current user orders):", this.currentUserOrders);
        this.setDisplayProducts();
      },
      error: (error) => this.handleError("Error fetching order headers", error)
    });
  }

  //Common error handler 
  private handleError(message: string, error: any): void {
    alert(message);
    console.error(message, error);
  }

  //get the images for the ordered products
  private getImagesForOrderedProducts() {
    if (this.purchasedCartItems.length === 0) return;

    const requests = this.purchasedCartItems.map((purchasedData: any) =>
      this.sportiQService.getProductsByProductName(purchasedData.data.productName)

    );
    forkJoin(requests).subscribe({
      next: (ImageUrlsResponses) => {
        // console.log("Image urls response",ImageUrlsResponses);
        this.productDetails = ImageUrlsResponses.map(ImageUrlsResponse =>
          ImageUrlsResponse.rows[0].doc.data
        );
        console.log("product details", this.productDetails);

      },
      error: (error) => this.handleError("Error fetching product details", error)
    });

  }

  //set the display products
  private setDisplayProducts(): void {

    this.displayPurchasedProducts=[];

    this.purchasedCartItems.forEach((dataInCart) => {
      const orderId = this.orderLine.find((o: any) => dataInCart._id === o.data.cartId)?.data?.orderId;
      const orderedDate = this.currentUserOrders.find((d: any) => d._id === orderId)?.data?.orderDate;
      const orderTime = this.currentUserOrders.find((t: any) => t._id === orderId)?.data?.orderAt;
      const imageUrl = this.productDetails.find((d) => d.productName === dataInCart.data.productName)?.productImageUrl

      const prepareData = {
        orderId: orderId,
        productName: dataInCart.data.productName,
        imageUrl: imageUrl,
        quantity: dataInCart.data.quantity,
        discountedSellingPrice: dataInCart.data.discountedSellingPrice,
        deliverDate: orderedDate,
        deliverTime: orderTime
      }

      this.displayPurchasedProducts.push(prepareData)
    });

  // Sort orders by latest delivered date & time
  this.displayPurchasedProducts.sort((a, b) => {
    const dateA = new Date(`${a.deliverDate} ${a.deliverTime}`).getTime();
    const dateB = new Date(`${b.deliverDate} ${b.deliverTime}`).getTime();
    return dateB - dateA; // Latest first
  });

  console.log("Sorted display ordered products:", this.displayPurchasedProducts);
}

  openReviewDialog(order: any) {
    this.currentOrder = order;
    this.isReviewDialogOpen = true;
  }

  closeReviewDialog() {
    this.isReviewDialogOpen = false;
    this.selectedRating = 0; // Reset rating
    this.reviewText = ''; // Clear review text
    this.ratingError=false;
    this.feedbackError=false;
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
  }

  submitReview() {
    this.ratingError = this.selectedRating === 0; // True if rating is not selected
    this.feedbackError = !this.reviewText.trim(); // True if feedback is empty

  
     // Stop submission if validation fails
  if (this.ratingError || this.feedbackError) {
    return;
  }

  const reviewData={
    _id:`productreview_2_${uuidv4()}`,
    data:{
      productName:this.currentOrder.productName,
      email:this.loggedUser.email,
      rating:this.selectedRating,
      review:this.reviewText,
      date:new Date().toISOString().split('T')[0],
      type:'review',
    }
  }

  this.sportiQService.createOrder(reviewData).subscribe({
    next:(response)=>{
      alert("Review submitted successfully");
      this.loadReviewProducts();
    },
    error:(error)=>{
      alert("error on while submitting the review");
      console.log("error on while submitting the review",error);
      
    }
  })
    console.log('Review Submitted:', {
      orderId: this.currentOrder.orderId,
      rating: this.selectedRating,
      review: this.reviewText
    });

    this.closeReviewDialog();
  }

  //get the current user reviewed products
  loadReviewProducts(){
    this.sportiQService.getReviewsByEmail(this.loggedUser.email).subscribe({
      next:(response)=>{
        if(response.rows.length===0) return
        this.reviewedProducts=new Set(response.rows.map((row:any)=>`${row.doc.data.productName}`));
        console.log("reviewed products",this.reviewedProducts);
      },
      error:(error)=>{
        alert("error on while fetching reviewed products");
        console.log("error on while fetching reviewed products",error);
      }
    });
  }
  
}
