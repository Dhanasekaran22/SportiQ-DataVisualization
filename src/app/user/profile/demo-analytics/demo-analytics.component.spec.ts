import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoAnalyticsComponent } from './demo-analytics.component';

describe('DemoAnalyticsComponent', () => {
  let component: DemoAnalyticsComponent;
  let fixture: ComponentFixture<DemoAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemoAnalyticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DemoAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
