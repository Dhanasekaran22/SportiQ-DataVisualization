import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-all-products',
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.css'
})
export class AllProductsComponent implements OnInit {

  constructor(private sportiQService:AppService,private router:Router) { }

  //store all products
  allProducts: any[] = [];

  //filteredProducts
  filteredProducts:any[]=[];
  
  //to show the available stocks filter section
  isAvailable:boolean=false;

  maxPrice:number=0;      //maximum price
  selectedPrice:number=0;  //user selected price for filtering

  ngOnInit(): void {
    this.loadProductDetails();
  }

  //load the all products
  loadProductDetails() {
    this.sportiQService.getAllProducts().subscribe({
      next: (response) => {
        console.log("Fetching All Products");
        this.allProducts = response.rows.map((row: any) => row.doc.data).filter((dataInProducts:any)=>dataInProducts.productStatus===true);
        
        // Initialize filteredProducts
        this.filteredProducts=[...this.allProducts];  

        //set the max price
        this.maxPrice=this.allProducts.length ? Math.max(...this.allProducts.map(data=>data.productSellingPrice)):0;

        this.selectedPrice=this.maxPrice;
        
        console.log("All Products",this.allProducts);
      }
    })
  }

  // navigate to product details
  navigateToProductDetails(productName:string){
    console.log("product Name in all products: ",productName.replace(/\s+/g, '--'));
    this.router.navigate([`all-products/${productName.replace(/\s+/g, '--')}`]);
  }

  //toggle Availability filter section
  showAvailability(){
    this.isAvailable=!this.isAvailable;
  }

  //filter products based on stock and price range
  filterProducts(stockStatus?:string){
   let filteredProducts=[...this.allProducts];

   //filter by stock availability
   if(stockStatus==='outOfStock'){
    filteredProducts=filteredProducts.filter(product=>product.productStock===0);
   }
   else if(stockStatus==='inStock'){
    filteredProducts=filteredProducts.filter(product=>product.productStock>0);
   }

   //filter by price range
   filteredProducts=filteredProducts.filter(product=>product.productSellingPrice<=this.selectedPrice);

   this.filteredProducts=filteredProducts;
  }
}