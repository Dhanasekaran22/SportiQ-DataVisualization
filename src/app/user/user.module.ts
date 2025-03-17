import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { FormsModule } from '@angular/forms';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { AddToCartComponent } from './add-to-cart/add-to-cart.component';
import { DashboardComponent } from './profile/dashboard/dashboard.component';
import { AnalyticsComponent } from './profile/analytics/analytics.component';
import { OrdersComponent } from './profile/orders/orders.component';
import { TrendingProductsComponent } from './trending-products/trending-products.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AnalyzeProductsComponent } from './profile/analyze-products/analyze-products.component';
@NgModule({
  declarations: [
    NavbarComponent,
    HomeComponent,
    RegisterComponent,
    ProfileComponent,
    AddToCartComponent,
    DashboardComponent,
    AnalyticsComponent,
    OrdersComponent,
    TrendingProductsComponent,
    AnalyzeProductsComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    FormsModule,
    MatIconModule,
    MatCardModule
  
  ],
  exports:[
    NavbarComponent,
    HomeComponent,
    RegisterComponent,
    ProfileComponent,
    AddToCartComponent,
    DashboardComponent,
    AnalyticsComponent,
    OrdersComponent
  ]
})
export class UserModule { }
