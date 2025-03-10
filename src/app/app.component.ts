import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  isPaymentSuccessPage=false;
  isProfilePage=false;

  constructor(private router:Router){
    this.router.events.subscribe(()=>{
      this.isPaymentSuccessPage = this.router.url.includes('/payment-success');  
      this.isProfilePage=this.router.url.startsWith('/profile')    
    });
  }


}
