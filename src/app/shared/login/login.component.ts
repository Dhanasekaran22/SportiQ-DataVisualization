import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(
    private sportiQService:AppService,
    private router: Router) { };

  loggedUser = {  // It stores the entered data in the view page by using ngModel
    email: '',
    password: ''
  }

  isFormSubmitted = false;    // used as the flag to check the form is submitted 

  emailError = '';            // It stores the email error message in the checkUserCredentials method
  passwordError = '';         // It stores the password error message in the checkUserCredentials method


  checkUserCredentials(formData: NgForm) {
    this.isFormSubmitted = true;
    this.sportiQService.checkUser(this.loggedUser.email).subscribe({
      next:(response)=>{
        if(response.rows.length ===0){
          this.emailError='Email not found!'
          return;
        }

        const userData=response.rows[0].doc.data;
        

        if(userData.password===this.loggedUser.password){
          console.log("login successful!",userData);
          
          this.emailError='';     //clear any email errors
          this.passwordError='';  //clear any password errors

          this.sportiQService.setUserData({name:userData.customerName,email:userData.email});
          // console.log(localStorage);
          
          alert("login successful")

          this.router.navigate(['']);
          this.resetForm();
        }
        else{
          this.passwordError="Incorrect password!"
        }
      },
      error:(error)=>{
        console.log("error on while logging in");
        alert("Error on while logging in");
        
      }
      
    })
  }

  resetForm() {         // Reset all the fields that are null
    this.loggedUser = {
      email: '',
      password: ''
    };
    this.emailError = '';
    this.passwordError = '';
    this.isFormSubmitted = false;                                // Reset the form submission flag also
  }
}
