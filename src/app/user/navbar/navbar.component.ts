import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  //stores category & subcategories
  categoriesAndSubCategories: any[] = []

  //show dropdown when hover the all products
  isDropDownVisible = false;

  //calculate the cart items count
  cartCount=0;

  constructor(private sportiQService: AppService, private route: Router) { };

  ngOnInit(): void {
    this.loadCategoriesWithSubCategories();

    this.sportiQService.loadCartCount();
    
    this.sportiQService.cartCount$.subscribe(count=>{
      this.cartCount=count;
    })
  }


  //Getting all categories from the category view
  loadCategoriesWithSubCategories() {
    this.sportiQService.getAllCategories().subscribe({
      next: (response) => {
        const categoryList = response.rows.map((row: any) => ({
          category_id: row.id,
          categoryName: row.value,
          categoryNavImage: row.doc.data.categoryNavImage,
          categoryHomeImage: row.doc.data.categoryMainImage,
          subCategories: []
        }));
        // console.log("category list",categoryList);

        categoryList.forEach((category: any) => {
          // console.log(category.category_id);
          this.sportiQService.getSubcategoriesByCategoryId(category.category_id).subscribe({
            next: (subResponse) => {
              category.subCategories = subResponse.rows.map((subRow: any) => ({
                subCategory_id: subRow.id,
                subCategoryName: subRow.value
              }));

            },
            error: (error) => {
              alert("Error Fetching subcategories");
              console.log("Error Fetching subcategories", error)
            }
          });
        })

        //store the category and subCategory array
        this.categoriesAndSubCategories = categoryList;
        console.log("Categories and subCategories", this.categoriesAndSubCategories);

      },
      error: (error) => {
        alert("error on while fetching category");
        console.log("error on while fetching category", error);
      }
    });
  }

  filterSubCategories(category: string, subCategory: string) {
    this.route.navigate([`collections/${category}/${subCategory}`]);
  }

  filterCategories(category: string) {
    this.route.navigate([`pages/${category}`]);
  }

  showDropDown() {
    this.isDropDownVisible = true;
  }

  hideDropDown() {
    this.isDropDownVisible = false;
  }

}
