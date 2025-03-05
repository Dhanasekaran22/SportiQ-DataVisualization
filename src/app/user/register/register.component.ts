import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterUsers } from '../../types/registeredUsersType';
import { NgForm } from '@angular/forms';
import { AppService } from '../../service/app.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  constructor(
    private router: Router,
    private sportiQService:AppService,) { }

  // User data model to bind form inputs
  user: RegisterUsers = {
    customerName: '',
    email: '',
    password: '',
    createdDate: undefined,
    createdAt: undefined,
    type: 'register',

  };

  confirmPassword = '';

  isFormSubmitted = false; // to validate the required for whole form field, when form is submitted

  // Password validation criteria flags
  isPasswordValidLength = false;
  hasSpecialChar = false;
  hasCapitalLetter = false;
  hasNumber = false;

  emailExists = false;  // Flag to check if email already exists


  // Method to check if email already exists in the database
  emailExistsOrNot() {
    if (!this.user.email) return;

    this.sportiQService.checkUser(this.user.email).subscribe({
      next: (response) => {
        this.emailExists = response.rows.length > 0;
        // console.log("check email response", response);
      },
      error: (error) => {
        alert("error on while checking email");
        console.log("error on while checking email", error);
      }
    });

  }


  // Method to check if password and confirm password match
  checkPasswordMatch(): boolean {
    return (this.user.password !== undefined && this.user.password === this.confirmPassword);
  }


  // Password validation method to check for length, special char, capital letter, and number
  validatePassword() {
    const password = this.user.password ?? '';  // Ensure it's always a string
    this.isPasswordValidLength = password.length >= 8;                      // Minimum length 8
    this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);          // Special character validation
    this.hasCapitalLetter = /[A-Z]/.test(password);                         // Capital letter validation
    this.hasNumber = /\d/.test(password);                                   // Number validation
  }

  // Method to check if all password criteria are met
  isPasswordCriteriaMet(): boolean {
    return this.isPasswordValidLength && this.hasSpecialChar && this.hasCapitalLetter && this.hasNumber;
  }

  // Submit the form data
  submitForm(formData: NgForm) {
    this.isFormSubmitted = true;                      // Set form submitted flag to true

    console.log("Email Already exists", this.emailExists);          // Check if email already exists


    // Check if form did not meet the logical validation
    if (!formData.valid || !this.checkPasswordMatch() || !this.isPasswordCriteriaMet() || this.emailExists) {
      return;                 // Stop execution if validation fails
    }

    // Prepare user data for register form submission
    const registerData = { ...this.user };
    console.log(registerData);
    registerData.createdDate = new Date().toISOString().split('T')[0];
    registerData.createdAt = Date.now();

    // Call service to add customer to the database
    this.sportiQService.addCustomers(registerData).subscribe({
      next: (response) => {
        alert("Register Successfully");
        this.router.navigate(['/login']);      // Navigate to login page after successful registration
        this.resetForm();                     // Reset form fields after successful registration
      },
      error: (error) => {
        alert("Error occur during registration");   // throws errors if any occurs on registration
        console.log("Error on register: ", error);
      }
    });

  }

  // Reset form fields after successful submission
  resetForm() {
    this.user = {
      customerName: '',
      email: '',
      password: '',
      createdDate: undefined,
      createdAt: undefined,
      type: 'register',
    };
    this.confirmPassword = '';
    this.isFormSubmitted = false;
    this.emailExists = false;
  }
}
