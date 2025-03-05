import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../service/app.service';
import { catchError, forkJoin, of } from 'rxjs';
import { ChartDataType } from '../../../types/chartDataType';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {

  constructor(private sportiQService: AppService) { }

  //views in DB
  orderDetailView: any[] = [];   //order line 
  orderView: any[] = [];         //order header
  productView: any[] = [];
  categoryView: any[] = [];
  subCategoryView: any[] = [];
  cartView: any[] = [];

  //prepare data for the template charts
  availableObjects=['Product','Orders'];
  availableXFields=['Product name'];
  availableYFields=['selling price','discounted selling price','available stock'];
  

  ngOnInit(): void {
    this.loadAllData();
  }

  // Load all data in parallel using forkJoin()
  loadAllData() {
    forkJoin({
      orderDetails: this.sportiQService.getallOrderDetails().pipe(
        catchError(error => this.handleError('Order Details', error))
      ),
      orders: this.sportiQService.getAllOrders().pipe(
        catchError(error => this.handleError('Orders', error))
      ),
      cartViews: this.sportiQService.getAllCartItems().pipe(
        catchError(error => this.handleError('Cart view', error))
      ),
      products: this.sportiQService.getAllProducts().pipe(
        catchError(error => this.handleError('Products', error))
      ),
      categories: this.sportiQService.getAllCategories().pipe(
        catchError(error => this.handleError('Categories', error))
      ),
      subcategories: this.sportiQService.getAllSubcategories().pipe(
        catchError(error => this.handleError('Subcategories', error))
      )
    
    }).subscribe({
      next: ({ orderDetails, orders, products, categories, subcategories, cartViews}) => {
        this.orderDetailView = orderDetails ? orderDetails.rows.map((row: any) => row.doc) : [];
        this.orderView = orders ? orders.rows.map((row: any) => row.doc) : [];
        this.cartView = cartViews ? cartViews.rows.map((row: any) => row.doc) : [];
        this.productView = products ? products.rows.map((row: any) => row.doc) : [];
        this.categoryView = categories ? categories.rows.map((row: any) => row.doc) : [];
        this.subCategoryView = subcategories ? subcategories.rows.map((row: any) => row.doc) : [];

        console.log("Order Detail View:", this.orderDetailView);
        console.log("Order View:", this.orderView);
        console.log("cart view",this.cartView);
        console.log("Product View:", this.productView);
        console.log("Category View:", this.categoryView);
        console.log("Subcategory View:", this.subCategoryView);

        this.prepareFormattedData();
      }
    });
  }

  // Handle API errors and return an empty observable so other API calls continue
  private handleError(apiName: string, error: any) {
    console.error(`Error fetching ${apiName}:`, error);
    alert(`Error on while fetching ${apiName}`);
    return of(null); // Return empty observable to prevent `forkJoin()` from failing completely
  }

  //prepare data in a format for proceeding with chart
  prepareFormattedData(){
    const chartData:ChartDataType[]=[];

    this.orderDetailView.forEach(orderDetail=>{
      const order=this.orderView.find(o=>o._id===orderDetail.data.orderId);
      const cartItem=this.cartView.find(c=>c._id===orderDetail.data.cartId);
      const product=this.productView.find(p=>p.data.productName===cartItem?.data.productName);
      const subCategory=this.subCategoryView.find(s=>s._id===product?.data.productSubCategoryId);
      const category=this.categoryView.find(ca=>ca._id===subCategory?.data.categoryId);
      const sellingPrice=this.productView.find(sp=>sp.data.productSellingPrice===product?.data.productSellingPrice);

      if(order && cartItem && product && subCategory && category){
        chartData.push({
          orderId:orderDetail.data.orderId, 
          productName:product?.data.productName,
          quantity:cartItem?.data.quantity,
          discountedSellingPrice:product?.data.discountedSellingPrice * cartItem?.data.quantity,
          sellingPrice:sellingPrice?.data.productSellingPrice,
          discount:product?.data.productDiscount,
          subCategoryName:subCategory?.data.subcategoryName,
          categoryName:category?.data.categoryName,
          combinedName:`${category?.data.categoryName} ${subCategory?.data.subcategoryName}`,
          orderDate:order?.data.orderDate,
          AvailableStock:product.data.productStock
        });
      }
    });

    console.log("prepared chart data",chartData);
    
    
    
  }
}
