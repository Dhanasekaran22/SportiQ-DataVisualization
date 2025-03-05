import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { FormsModule } from '@angular/forms';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';



@NgModule({
  declarations: [
    OrderSummaryComponent,
    PaymentSuccessComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports:[
    OrderSummaryComponent,
    PaymentSuccessComponent
  ]
})
export class BillingModule { }
