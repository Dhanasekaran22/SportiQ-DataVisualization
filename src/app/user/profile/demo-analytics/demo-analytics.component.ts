import { Component } from '@angular/core';

interface DataObject {
  name: string;
  expanded: boolean;
  fields: { displayName: string; backendKey: string }[]; // Map UI names to backend keys
}

@Component({
  selector: 'app-demo-analytics',
  templateUrl: './demo-analytics.component.html',
  styleUrl: './demo-analytics.component.css'
})

export class DemoAnalyticsComponent {

  dataObjects: DataObject[] = [
    {
      name: "Product",
      expanded: false,
      fields: [
        { displayName: "Product Name", backendKey: "productName" },
        { displayName: "Discounted Selling Price", backendKey: "discountedSellingPrice" },
        { displayName: "Selling Price", backendKey: "discountedSellingPrice" },
        { displayName: "Product Discount", backendKey: "productDiscount" },
        { displayName: "Available Stock", backendKey: "availableStock" }
      ]
    },
    {
      name: "Order",
      expanded: false,
      fields: [
        { displayName: "Ordered People", backendKey: "orderedPeople" }
      ]
    }
  ];

  toggleExpand(index: number) {
    this.dataObjects[index].expanded = !this.dataObjects[index].expanded;
  }

  selectedField: string = '';

  onFieldClick(field: { displayName: string; backendKey: string }) {
    console.log(`selected Field: ${field.backendKey}`);
    this.selectedField = field.backendKey; 
  }
}
