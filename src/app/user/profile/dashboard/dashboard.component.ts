import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit,AfterViewInit {

  currentUserPurchasedProducts: any[] = [];

  orderCount = 0;
  totalSpending = 0;


  ngOnInit(): void {
    //retrieve the current user order data from the local storage
    const storedData = localStorage.getItem('currentUserPurchasedProducts')
    if (!storedData) return

    this.currentUserPurchasedProducts = JSON.parse(storedData);
    console.log("current user purchased order data", this.currentUserPurchasedProducts);
    this.calculateMetrics();
    this.spendingTrend();
  }

  spendingData: { date: string; amount: number }[] = [];

  //for render the chart
  ngAfterViewInit(): void {
    this.spendingData=this.spendingTrend();
    this.renderChart();
  }

  // calculate order count and total spending
  calculateMetrics() {

    //get the order count
    const uniqueOrderIds = new Set(this.currentUserPurchasedProducts.map((order) => order.orderId));
    this.orderCount = uniqueOrderIds.size;
    console.log("total orders", this.orderCount);

    //get the total spending amount 
    this.totalSpending = this.currentUserPurchasedProducts.reduce((total, order) =>
      total + order.discountedSellingPrice, 0);
    console.log("total spending", this.totalSpending);
  }

  spendingTrend() {
    let spendingData: { date: string, amount: number }[] = [];

    //group by deliver date and sum amounts
    const grouped: Record<string, number> = this.currentUserPurchasedProducts.reduce((acc, item) => {
      acc[item.deliverDate] = (acc[item.deliverDate] || 0) + item.discountedSellingPrice;
      return acc;
    }, {});

    console.log("spending data without array", Object.entries(grouped));

    //convert array
    spendingData = Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())      //here we destructuring and it extracts only the date from each entry.
      .map(([date, amount]) => ({ date, amount }));

    console.log("spending data with array", spendingData);

    return spendingData;
  }

  renderChart() {
    const element = d3.select('#chart');
    element.html('');

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = element.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse('%Y-%m-%d');
    this.spendingData.forEach(d => (d.date = parseDate(d.date) as any));

    this.spendingData.sort((a, b) => (a.date as any) - (b.date as any));

    const xScale = d3.scaleTime()
      .domain(d3.extent(this.spendingData, d => d.date as any) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.spendingData, d => d.amount) as number])
      .range([height, 0]);

    const area = d3.area<{ date: any; amount: number }>()
      .x(d => xScale(d.date as any))
      .y0(height)
      .y1(d => yScale(d.amount));

    svg.append('path')
      .datum(this.spendingData)
      .attr('fill', 'steelblue')
      .attr('opacity', 0.6)
      .attr('d', area);

      const xAxis = d3.axisBottom(xScale)
      .ticks(this.spendingData.length)
      .tickFormat((domainValue, index) => d3.timeFormat('%b %d')(domainValue as Date));
        svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(-45)');

    const yAxis = d3.axisLeft(yScale);
    svg.append('g').call(yAxis);
  }
}


