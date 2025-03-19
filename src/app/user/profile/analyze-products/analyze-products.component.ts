import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../service/app.service';

@Component({
  selector: 'app-analyze-products',
  templateUrl: './analyze-products.component.html',
  styleUrl: './analyze-products.component.css'
})
export class AnalyzeProductsComponent  {

  constructor(private sportiQService: AppService) { };

  //user typed input will bind here
  userInput: string = '';

  //store all products name
  allProducts: any[] = [];

  //filter products based on search
  filterProducts: any[] = [];


  noResultsMessage = '';
  onSearch() {
    if (this.userInput.trim().length > 0) {
      this.sportiQService.getProductsBySearch(this.userInput).subscribe({
        next: (response) => {
          this.filterProducts = response.rows.map((row: any) => row.doc);
          console.log("searching product", this.filterProducts);

          //if no products found
          if (this.filterProducts.length === 0)
            this.noResultsMessage = "No products found. Try searching with keywords.";
          else
            this.noResultsMessage = ''

        },
        error: (error) => {
          alert("error on while searching the product");
          console.log("error on while searching the product", error);
        }
      });
    }
    else {
      this.filterProducts = [];
      this.noResultsMessage = '';
    }
  }

  //when the user clicks a product from the list
  selectProduct(product: any) {
    this.userInput = product.data.productName;
    this.filterProducts = [];
    this.noResultsMessage = '';

    console.log("selected on search", this.userInput);

  }
}
