import { Component, OnInit } from '@angular/core';
import { AppService } from '../../service/app.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trending-products',
  templateUrl: './trending-products.component.html',
  styleUrl: './trending-products.component.css'
})
export class TrendingProductsComponent implements OnInit {

  topProducts: any[] = [];
  topProductDetails: any[] = [];

  constructor(private sportiQService: AppService,private router:Router) { }

  ngOnInit(): void {
    this.getPurchasedProductsCount();
  }

  //get all the purchased products
  getPurchasedProductsCount() {
    this.sportiQService.getPurchasedProductsCount().subscribe({
      next: (response) => {
        this.topProducts = response.rows.map((row: any) => row)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 6);

        console.log("Top products", this.topProducts);
        this.getTrendingProductDetails();
      },
      error: (error) => {
        alert("error on while purchased products count");
        console.log("error on while purchased products count", error);
      }
    });
  }


  //get the product details
  getTrendingProductDetails() {
    if (this.topProducts.length == 0) return;

    const productRequests = this.topProducts.map((topProduct: any) =>
      this.sportiQService.getProductsByProductName(topProduct.key));

    forkJoin(productRequests).subscribe({
      next:(responses)=>{
        this.topProductDetails=responses.map((response)=>response.rows[0].doc)
        console.log("top product details",this.topProductDetails);
      },
      error:(error)=>{
        alert("error on while getting top 10 product details");
        console.log("error on while getting top 10 product details",error);
      }
    })
  }

  navigateToProductDetails(productDetail:any){
    this.router.navigate([`all-products/${productDetail.data.productName.replace(/\s+/g, '-')}`]);
  }

}
