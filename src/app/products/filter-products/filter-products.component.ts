import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-filter-products',
  templateUrl: './filter-products.component.html',
  styleUrl: './filter-products.component.css'
})
export class FilterProductsComponent implements OnInit {
  constructor(
    private sportiQService:AppService,
    private route: ActivatedRoute,
    private router: Router) { }

  //To store particular Products based on category => subCategory 
  filterProducts: any[] = [];

  //to store the products that depends on the category
  categoryProducts: any[] = [];

  //to store category id and subcategory from the category view and subcategory view
  categoryId: string = '';
  subCategoryId: string = '';

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      const category = params['category'];
      const subCategory = params['subCategory'];
      console.log(`category: ${category} ,subCategory: ${subCategory}`);
      this.getCategoryId(category, subCategory);
    });
  }

  //get the category_id and subcategory_id for fetching the filter products
  getCategoryId(category: string, subCategory: string | undefined) {

    //get the all category id from the category view  
    this.sportiQService.getAllCategories().subscribe({
      next: (response) => {
        this.categoryId = response.rows.map((row: any) => row.doc).filter((dataInCategory: any) => dataInCategory.data.categoryName=== category)[0]._id;
        console.log("selected category id ", this.categoryId);

        if (subCategory !== undefined)
          this.getSubCategoryId(subCategory);

        else
          this.loadCategoryBasedProducts();
      },

      error: (error) => {
        alert("Error on while filtering category Id");
        console.log("Error on while filtering category id", error);
      }
    });
  }

  //get the subCategory id based on the category id from the category view
  getSubCategoryId(subCategory: string) {

    this.sportiQService.getSubcategoriesByCategoryId(this.categoryId).subscribe({
      next: (response) => {
        this.subCategoryId = response.rows.filter((row: any) => row.value === subCategory)[0].id;
        console.log("selected subCategory Id", this.subCategoryId);
        this.loadFilterProducts();
      },
      error: (error) => {
        alert("error on while filtering subcategory id");
        console.log("error on while filtering subcategory id", error);
      }
    })
  }

  loadFilterProducts() {

    // here we use the query to get the particular products
    this.sportiQService.getProductsBySubCategoryId(this.subCategoryId).subscribe({
      next: (response) => {
        this.filterProducts = response.rows.map((row: any) => row.doc.data)
        console.log("Filter Products", this.filterProducts);

      },
      error: (error) => {
        alert("error on while filtering product items");
        console.log("error on while filtering product items", error);
      }
    });
  }

  loadCategoryBasedProducts() {
    this.sportiQService.getSubcategoriesByCategoryId(this.categoryId).subscribe({
      next: (response) => {

        // to store the subcategory Id's for filtering the category based products
        const subCatIds = response.rows.map((row: any) => row.id)
        console.log("filteredSubcategoryIds", subCatIds);

        //before pushing new data to clear old data and avoid duplicate entries.
        this.categoryProducts = [];

        subCatIds.forEach((id: string) => {
          this.sportiQService.getProductsBySubCategoryId(id).subscribe({
            next: (response) => {

              const products = response.rows.map((row: any) => row.doc.data);
              this.categoryProducts.push(...products);  //products (an array) will be added as a single element → incorrect (nested array issue)
              console.log("Filtered category based products ", this.categoryProducts);
            },
            error: (error) => {
              alert("error on while fetching filter category products");
              console.log("error on while fetching filter category products ", error);
            }
          });
        })
      },
      error: (error) => {
        alert("error on while fetching the subCategory Id's");
        console.log("error on while fetching the subCategory Id's", error);
      }
    });
  }

  navigateToProductDetails(productData: any) {
    this.router.navigate([`product/${productData.productName.replace(/\s+/g, '--')}`])
  }

}
