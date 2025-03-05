import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllProductsComponent } from './all-products/all-products.component';
import { FilterProductsComponent } from './filter-products/filter-products.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    AllProductsComponent,
    FilterProductsComponent,
    ProductDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports:[
    AllProductsComponent,
    FilterProductsComponent,
    ProductDetailsComponent
  ]
})
export class ProductsModule { }
