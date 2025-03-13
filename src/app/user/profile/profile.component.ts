import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  constructor( private sportiQService:AppService, private router: Router) { }

  loggedUser: any;
  showLogoutModal: boolean = false;
  isProfilePage: boolean = false;

  currentDate:string='';

  ngOnInit(): void {
    this.loggedUser = this.sportiQService.getUserData();
    console.log("In User Profile: ", this.loggedUser);
    this.getCurrentDate();
  }

  // Show logout confirmation modal
  confirmLogout() {
    this.showLogoutModal = true;
  }

  logout() {
    this.sportiQService.logout();
    alert("Logged out successfully");
    this.showLogoutModal = false;
    localStorage.removeItem('currentUserPurchasedProducts')
    this.router.navigate(['/login']);
  }

  // Cancel logout
  cancelLogout() {
    this.showLogoutModal = false;
  }

  getCurrentDate(){
    const date=new Date();
    const options:Intl.DateTimeFormatOptions={day:'numeric',month:'long'};
    this.currentDate=date.toLocaleDateString('en-US',options)
  }

}
