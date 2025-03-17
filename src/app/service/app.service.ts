import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegisterUsers } from '../types/registeredUsersType';
import { v4 as uuidv4 } from 'uuid';
import { AddToCartType } from '../types/addToCartType';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseType } from '../types/responseType';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  readonly baseURL = 'https://192.168.57.185:5984/sportiq';
  readonly userName = 'd_couchdb';
  readonly password = 'Welcome#2';

  private headers = new HttpHeaders({
    'Authorization': 'Basic ' + btoa(this.userName + ':' + this.password),
    'Content-Type': 'application/json'
  });

  //store the registered users In DB
  addCustomers(data: RegisterUsers) {
    return this.http.post(this.baseURL, { _id: `customer_2_${uuidv4()}`, data: data }, { headers: this.headers });
  }

  //get the particular user details from DB
  checkUser(email: string) {
    const url = `${this.baseURL}/_design/Views/_view/customer_by_email?key="${email}"&include_docs=true`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //Store user data in local storage after login
  setUserData(user: { name: string, email: string }) {
    localStorage.setItem('loggedInUser', JSON.stringify(user));

    //get the local storage cart count for the logged user
    this.loadCartCount();
  }

  //Retrieved logged in user data
  getUserData() {
    const user = localStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  }

  //current user logged details
  isLoggedIn(): boolean {
    return localStorage.getItem('loggedInUser') !== null;
  }

  //logout the current user
  logout() {

    localStorage.removeItem('loggedInUser');
    this.cartCountSubject.next(0);
  }

  //fetch all category in category view 
  getAllCategories(): Observable<any> {
    return this.http.get(`${this.baseURL}/_design/Views/_view/category_by_id?include_docs=true`, { headers: this.headers });
  }

  //fetch the particular subcategory based on the categoryId => key 
  getSubcategoriesByCategoryId(categoryId: string): Observable<any> {
    return this.http.get(`${this.baseURL}/_design/Views/_view/subcategory_by_categoryid?key="${categoryId}"`, { headers: this.headers });
  }

  //get all the subcategories
  getAllSubcategories(): Observable<any> {
    return this.http.get(`${this.baseURL}/_design/Views/_view/subcategory_by_categoryid?include_docs=true`, { headers: this.headers });
  }

  //fetch the all products
  getAllProducts(): Observable<any> {
    const url = `${this.baseURL}/_design/Views/_view/products_by_productname?include_docs=true`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the particular product using subCategoryId
  getProductsBySubCategoryId(subcategoryId: string) {
    const url = `${this.baseURL}/_design/Views/_view/products_by_subcategoryid?key="${subcategoryId}"&include_docs=true`
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the particular product using productName
  getProductsByProductName(productName: string) {    
    const url = `${this.baseURL}/_design/Views/_view/products_by_productname?key="${productName}"&include_docs=true`
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the product Stock
  checkProductStock(currentQuantity: number, productStock: number) {
    console.log("current quantity: ", currentQuantity, "product Stock: ", productStock);

    if (currentQuantity > productStock) {
      alert(`only ${productStock} Available`);
      return true;
    }

    return false;
  }

  cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  //load the cart items count
  loadCartCount() {

    const user = this.getUserData();
    if (!user)
      return;
    
    let cartCount = 0;
    const cartKey = user.email;

    this.getCurrentUserCartItems(cartKey).subscribe({
      next: (response) => {
        cartCount = response.length;
        console.log("in load cart count service", cartCount);

        //set in the behavior subject
        this.cartCountSubject.next(cartCount);
      }
    })

  }

  //update cart count
  updateCartCount(count: number) {

    const user = this.getUserData();
    if (!user)
      return;

    this.cartCountSubject.next(count);
  }

  //store the cart items based on the customerId In DB 
  addToCart(data: AddToCartType) {
    return this.http.post(this.baseURL, { _id: `addtocart_2_${uuidv4()}`, data: data }, { headers: this.headers })
      .pipe(
        map(() => {
          const newCount = this.cartCountSubject.value + 1;
          console.log("add to cart in service", newCount);

          this.updateCartCount(newCount);
        })
      );
  }

  //delete the particular cart items
  //update the cart count in the local storage
  deleteCartItem(_id: string, _rev: string) {
    const url = `${this.baseURL}/${_id}?rev=${_rev}`;
    return this.http.delete(url, { headers: this.headers })
      .pipe(
        map(() => {
          const newCount = Math.max(this.cartCountSubject.value - 1, 0);
          console.log("delete in service", newCount);

          this.updateCartCount(newCount);
        })
      );
  }


  //get the current user cart items based on the customer Email
  getCurrentUserCartItems(email: string) {
    const url = `${this.baseURL}/_design/Views/_view/addtocart_by_email?key="${email}"&include_docs=true&reduce=false`;

    return this.http.get<any>(url, { headers: this.headers }).pipe(
      map((response: { rows: any[] }) => response.rows
        .map((row: any) => row.doc)
        .filter((DataInCart: any) => DataInCart.data.cartStatus === "not purchased")
      )
    )
  }

  //get all cart items
  getAllCartItems() {
    const url = `${this.baseURL}/_design/Views/_view/addtocart_by_email?include_docs=true&reduce=false`;
    return this.http.get<any>(url, { headers: this.headers })
  }

  //get the purchased products count
  getPurchasedProductsCount() {
    const url = `${this.baseURL}/_design/Views/_view/addtocart_by_productname?reduce=true&group=true`;
    return this.http.get<any>(url, { headers: this.headers })
  }

  /* Directly call subscribe() inside the function itself, meaning the HTTP requests execute immediately 
    when getCartProductDetails(cartItems) is called.*/

  //get the product details for all items in the cart
  getCartProductDetails(cartItems: any[]): Observable<any[]> {
    const productRequests = cartItems.map(item =>

      this.http.get<any>(`${this.baseURL}/_design/Views/_view/products_by_productname?key="${item.data.productName}"&include_docs=true`,
        { headers: this.headers }
      )
        .pipe(map(response => response.rows.map((row: any) => row.doc)[0]))
    );


    return forkJoin(productRequests);
  }

  // calculate total prices for cart
  calculateTotals(cartItems: any[], cartProductDetails: any[]) {
    return cartItems.reduce(
      (totals, item) => {
        const product = cartProductDetails.find(p => p.productName === item.data.productName);
        if (product) {
          const quantity = item.data.quantity;
          totals.totalSellingPrice += product.productSellingPrice * quantity;
          totals.totalDiscountedPrice += (product.productSellingPrice - product.discountedSellingPrice) * quantity;
        }
        totals.finalTotal = totals.totalSellingPrice - totals.totalDiscountedPrice;
        return totals;
      },
      { totalSellingPrice: 0, totalDiscountedPrice: 0, finalTotal: 0 } // <--- This is the initial value-->
    );
  }



  /* Eg: update address (or setting active address) 
  by using the post instead of put */

  updateAndCreateBulkItems(updatedData: any) {
    const url = `${this.baseURL}/_bulk_docs`;
    return this.http.post<any>(url, { docs: updatedData }, { headers: this.headers });
  }

  // update the cart items 
  updateCartItems(updatedData: any) {
    const url = `${this.baseURL}/${updatedData._id}`;
    return this.http.put<any>(url, updatedData, { headers: this.headers });
  }

  //Add a new address
  addUserAddress(address: any) {
    return this.http.post(this.baseURL, { _id: `customeraddress_2_${uuidv4()}`, data: address }, { headers: this.headers });
  }

  //Fetch all addresses for the logged-in user
  getUserAddresses(email: string): Observable<any> {
    const url = `${this.baseURL}/_design/Views/_view/customeraddress_by_email?key="${email}"&include_docs=true`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //add the order header and line for the order 
  createOrder(orderData: any) {
    return this.http.post<ResponseType>(this.baseURL, orderData, { headers: this.headers });
  }

  //get all the orderDetails (line)
  getallOrderDetails(): Observable<any> {
    const url = `${this.baseURL}/_design/Views/_view/orderdetails_by_orderid?include_docs=true`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get all the order (header)
  getAllOrders() {
    const url = `${this.baseURL}/_design/Views/_view/order_by_orderdate?include_docs=true&reduce=false`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the current user purchased products in the cart view
  getCurrentUserPurchasedCartItems(email: string) {
    const url = `${this.baseURL}/_design/Views/_view/addtocart_by_email?key="${email}"&include_docs=true&reduce=false`;

    return this.http.get<any>(url, { headers: this.headers }).pipe(
      map((response: { rows: any[] }) => response.rows
        .map((row: any) => row.doc)
        .filter((DataInCart: any) => DataInCart.data.cartStatus === "purchased")
      )
    );
  }

  //get the current user order line which is order details by cartId
  getCurrentUserOrderDetails(CartId: string) {
    const url = `${this.baseURL}/_design/Views/_view/orderdetails_by_cartid?key="${CartId}"&include_docs=true`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the order (header) by using the order id
  getCurrentUserOrder(orderId: string) {
    const url = `${this.baseURL}/${orderId}`
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get the current user reviewed products
  getReviewsByEmail(email: string) {
    const url = `${this.baseURL}/_design/Views/_view/productreviews_by_email?key="${email}"&include_docs=true`
    return this.http.get<any>(url, { headers: this.headers });
  }

  //get all ratings
  getAllRatingProducts() {
    const url = `${this.baseURL}/_design/Views/_view/productreviews_by_email?include_docs=true`
    return this.http.get<any>(url, { headers: this.headers });
  }


}
