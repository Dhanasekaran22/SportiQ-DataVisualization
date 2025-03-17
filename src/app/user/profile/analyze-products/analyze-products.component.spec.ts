import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzeProductsComponent } from './analyze-products.component';

describe('AnalyzeProductsComponent', () => {
  let component: AnalyzeProductsComponent;
  let fixture: ComponentFixture<AnalyzeProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnalyzeProductsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnalyzeProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
