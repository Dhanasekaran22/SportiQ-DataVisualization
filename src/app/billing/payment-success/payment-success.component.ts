import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent {

  constructor(private router:Router){}

  transactionId: string = 'TXN1234567890'; // Sample transaction ID
  countdown: number = 5; // Auto redirect timer

  ngOnInit(): void {
    // Countdown for auto redirection
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.router.navigate(['']); // Redirect to home page
      }
    }, 1000);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
