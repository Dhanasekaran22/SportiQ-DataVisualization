import { Component } from '@angular/core';

@Component({
  selector: 'app-analyze-products',
  templateUrl: './analyze-products.component.html',
  styleUrl: './analyze-products.component.css'
})
export class AnalyzeProductsComponent {
  searchQuery: string = '';
}
