import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  
  currentUserPurchasedProducts: any[] = [];

  orderCount=0;
  totalSpending=0;


  ngOnInit(): void {
    //retrieve the current user order data from the local storage
    const storedData = localStorage.getItem('currentUserPurchasedProducts')
    if (!storedData) return

    this.currentUserPurchasedProducts = JSON.parse(storedData);
    console.log("current user purchased order data", this.currentUserPurchasedProducts);
    this.calculateMetrics();
  }

  // calculate order count and total spending
  calculateMetrics(){

    //get the order count
    const uniqueOrderIds=new Set(this.currentUserPurchasedProducts.map((order)=>order.orderId));
    this.orderCount=uniqueOrderIds.size;
    console.log("total orders",this.orderCount);
    
    //get the total spending amount 
    this.totalSpending=this.currentUserPurchasedProducts.reduce((total,order)=>
      total+order.discountedSellingPrice,0);
    console.log("total spending",this.totalSpending);
  }



}
