import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class CheckOutService {

  constructor(private http: HttpClient) { }

  readonly baseURL = 'https://192.168.57.185:5984/sportiq';
  readonly userName = 'd_couchdb';
  readonly password = 'Welcome#2';

  private headers = new HttpHeaders({
    'Authorization': 'Basic ' + btoa(this.userName + ':' + this.password),
    'Content-Type': 'application/json'
  });

 

}
