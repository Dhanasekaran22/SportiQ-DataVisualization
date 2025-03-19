import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './user/home/home.component';
import { LoginComponent } from './shared/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { ProfileComponent } from './user/profile/profile.component';
import { AllProductsComponent } from './products/all-products/all-products.component';
import { FilterProductsComponent } from './products/filter-products/filter-products.component';
import { ProductDetailsComponent } from './products/product-details/product-details.component';
import { AddToCartComponent } from './user/add-to-cart/add-to-cart.component';
import { OrderSummaryComponent } from './billing/order-summary/order-summary.component';
import { PaymentSuccessComponent } from './billing/payment-success/payment-success.component';
import { DashboardComponent } from './user/profile/dashboard/dashboard.component';
import { AnalyticsComponent } from './user/profile/analytics/analytics.component';
import { OrdersComponent } from './user/profile/orders/orders.component';
import { authGuardGuard } from './shared/auth-guard.guard';
import { TrendingProductsComponent } from './user/trending-products/trending-products.component';
import { AnalyzeProductsComponent } from './user/profile/analyze-products/analyze-products.component';
import { DemoAnalyticsComponent } from './user/profile/demo-analytics/demo-analytics.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuardGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'analyze-products', component: AnalyzeProductsComponent },
      {path:'demoAnalytics',component:DemoAnalyticsComponent},
      { path: 'orders', component: OrdersComponent },
      { path: '', redirectTo: 'orders', pathMatch: 'full' }
    ]
  },
  { path: 'all-products', component: AllProductsComponent },
  { path: 'trending', component: TrendingProductsComponent },
  { path: 'all-products/:productName', component: ProductDetailsComponent },
  { path: 'pages/:category', component: FilterProductsComponent },
  { path: 'collections/:category/:subCategory', component: FilterProductsComponent },
  { path: 'product/:productName', component: ProductDetailsComponent },
  { path: 'add-to-cart', component: AddToCartComponent },
  { path: 'order-summary', component: OrderSummaryComponent },
  { path: 'payment-success', component: PaymentSuccessComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
