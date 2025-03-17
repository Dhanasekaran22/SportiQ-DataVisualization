import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../service/app.service';
import { catchError, forkJoin, of } from 'rxjs';
import { ChartDataType } from '../../../types/chartDataType';
import * as d3 from 'd3';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {

  constructor(private sportiQService: AppService,) { }

  //views in DB
  orderDetailView: any[] = [];   //order line 
  orderView: any[] = [];         //order header
  productView: any[] = [];
  categoryView: any[] = [];
  subCategoryView: any[] = [];
  cartView: any[] = [];
  reviewView: any[] = [];

  //prepare Raw data 
  preparedRawData: ChartDataType[] = [];
  ratingPerProduct: { productName: string, averageRating: number }[] = [];

  //extracted data from the raw data
  chartData: any[] = [];

  //combined category and sub category name
  combinedNames: any[] = []

  ngOnInit(): void {
    this.loadAllData();
    window.addEventListener("resize", () => this.onChartSelection());
  }

  // Load all data in parallel using forkJoin()
  loadAllData() {
    forkJoin({
      orderDetails: this.sportiQService.getallOrderDetails().pipe(
        catchError(error => this.handleError('Order Details', error))
      ),
      orders: this.sportiQService.getAllOrders().pipe(
        catchError(error => this.handleError('Orders', error))
      ),
      cartViews: this.sportiQService.getAllCartItems().pipe(
        catchError(error => this.handleError('Cart view', error))
      ),
      products: this.sportiQService.getAllProducts().pipe(
        catchError(error => this.handleError('Products', error))
      ),
      subcategories: this.sportiQService.getAllSubcategories().pipe(
        catchError(error => this.handleError('Subcategories', error))
      ),
      categories: this.sportiQService.getAllCategories().pipe(
        catchError(error => this.handleError('Categories', error))
      ),
      review: this.sportiQService.getAllRatingProducts().pipe(
        catchError(error => this.handleError('ratings', error))
      )

    }).subscribe({
      next: ({ orderDetails, orders, products, subcategories, categories, cartViews, review }) => {

        this.orderDetailView = orderDetails ? orderDetails.rows.map((row: any) => row.doc) : [];
        this.orderView = orders ? orders.rows.map((row: any) => row.doc) : [];

        this.cartView = cartViews ? cartViews.rows.map((row: any) => row.doc)
          .filter((d: any) => d.data.cartStatus === "purchased") : [];

        this.productView = products ? products.rows.map((row: any) => row.doc)
          .filter((p: any) => this.cartView.some((c: any) => c.data.productName === p.data.productName)) : [];

        this.subCategoryView = subcategories ? subcategories.rows.map((row: any) => row.doc)
          .filter((sub: any) => this.productView.some((p: any) => p.data.productSubCategoryId === sub._id)) : [];

        this.categoryView = categories ? categories.rows.map((row: any) => row.doc)
          .filter((category: any) => this.subCategoryView.some((s: any) => s.data.categoryId === category._id)) : [];

        this.reviewView = review ? review.rows.map((row: any) => row.doc) : [];

        console.log("Order Detail View:", this.orderDetailView);
        console.log("Order View:", this.orderView);
        console.log("cart view", this.cartView);
        console.log("Product View:", this.productView);
        console.log("Category View:", this.categoryView);
        console.log("Subcategory View:", this.subCategoryView);
        console.log("review view", this.reviewView);

        this.prepareRawData();
        this.getAllProductReview();
      }
    });
  }

  // Handle API errors and return an empty observable so other API calls continue
  private handleError(apiName: string, error: any) {
    console.error(`Error fetching ${apiName}:`, error);
    alert(`Error on while fetching ${apiName}`);
    return of(null); // Return empty observable to prevent `forkJoin()` from failing completely
  }


  //prepare data in a format for proceeding with chart
  prepareRawData() {
    this.preparedRawData = [];

    this.orderDetailView.forEach(orderDetail => {
      const order = this.orderView.find(o => o._id === orderDetail.data.orderId);
      const cartItem = this.cartView.find(c => c._id === orderDetail.data.cartId);
      const product = this.productView.find(p => p.data.productName === cartItem?.data.productName);
      const subCategory = this.subCategoryView.find(s => s._id === product?.data.productSubCategoryId);
      const category = this.categoryView.find(ca => ca._id === subCategory?.data.categoryId);
      const sellingPrice = this.productView.find(sp => sp.data.productSellingPrice === product?.data.productSellingPrice);

      if (order && cartItem && product && subCategory && category) {
        this.preparedRawData.push({
          orderId: orderDetail.data.orderId,
          productName: product?.data.productName,
          quantity: cartItem?.data.quantity,
          discountedSellingPrice: product?.data.discountedSellingPrice,
          sellingPrice: sellingPrice?.data.productSellingPrice,
          discount: product?.data.productDiscount,
          subCategoryName: subCategory?.data.subcategoryName,
          categoryName: category?.data.categoryName,
          combinedName: `${category?.data.categoryName} - ${subCategory?.data.subcategoryName}`,
          orderDate: order?.data.orderDate,
          availableStock: product.data.productStock
        });
      }
    });
    console.log("prepared Raw data", this.preparedRawData);
  }

  //get the reviews per product
  getAllProductReview() {
    let ratingMap = new Map<string, { total: number, count: number }>();

    this.reviewView.forEach((dataInReviewView: any) => {

      let productName = dataInReviewView.data.productName;
      let rating = dataInReviewView.data.rating;

      if (ratingMap.has(productName)) {
        let productData = ratingMap.get(productName)!;
        productData.total += rating;
        productData.count += 1;
      }
      else {
        ratingMap.set(productName, { total: rating, count: 1 });
      }
    });

    this.ratingPerProduct = Array.from(ratingMap.entries()).map(([productName, data]) => ({
      productName,
      averageRating: parseFloat((data.total / data.count).toFixed(1)) //to fixed return string
    }));

    console.log("rating per product", this.ratingPerProduct);
    this.getExtractedData();
  }

  //Extract the needed data
  getExtractedData() {

    const groupedData = new Map<string, {
      productName: string,
      combinedName: string,
      sellingPrice: number,
      discountedSellingPrice: number,
      availableStock: number,
      discount: number,
      orderedPeople: string[],
      averageRating: number
    }>();

    this.preparedRawData.forEach(item => {

      const { productName, sellingPrice, discountedSellingPrice, availableStock, orderId, combinedName, discount } = item;

      if (!groupedData.has(productName)) {
        groupedData.set(productName, {
          productName,
          sellingPrice,
          discountedSellingPrice,
          combinedName,
          availableStock,
          discount,
          orderedPeople: [orderId],
          averageRating: 0
        });
      }
      else {
        groupedData.get(productName)?.orderedPeople.push(orderId);
      }
    });
    //convert grouped data to array
    this.chartData = Array.from(groupedData.values()).map(data => {

      //find the matching product for rating      
      const ratingData = this.ratingPerProduct.find(r => r.productName === data.productName);

      return {
        ...data,
        orderedPeople: data.orderedPeople.length,
        averageRating: ratingData ? ratingData?.averageRating : 0
      };
    });
    console.log("Extracted Data: ", this.chartData);

    const categoryAndSubCategory = new Set(this.chartData.map((data: any) => data.combinedName));
    this.combinedNames = Array.from(categoryAndSubCategory);
  }

  //prepare data for the template charts
  allObjects = ['Products', 'Orders'];
  selectedObjects: string[] = [];

  productXField = 'Products Name';
  productYFields = ['Discounted Selling Price', 'Available Stock', 'Discounts (%)', 'Rating', 'Selling Price'];
  orderYField = 'Ordered People';

  availableXField: string = '';
  availableYFields: string[] = [];

  selectedXField = '';
  selectedYField = '';

  //compare field
  selectedCompareField: string | null = '';

  selectedChartType = '';
  charts = ['Bar Chart', 'Line Chart', 'Pie Chart']


  //filter products
  selectedCombinedName: string = '';
  filterProducts: any[] = [];

  //for error message
  get productSelected(): boolean {
    return this.selectedObjects.includes('Products');
  }

  //select the objects and push into array
  toggleObject(obj: string) {
    if (this.selectedObjects.includes(obj)) {
      this.selectedObjects = this.selectedObjects.filter(item => item !== obj);
    }
    else {
      this.selectedObjects.push(obj);
    }
    console.log("Selected Objects:", this.selectedObjects);
    this.updateFields();
  }

  //update available fields based on selected objects
  updateFields() {
    this.availableXField = '';
    this.availableYFields = [];

    if (this.selectedObjects.includes('Products')) {
      this.availableXField = this.productXField;
      this.availableYFields.push(...this.productYFields);
    }
    if (this.selectedObjects.includes('Orders')) {
      this.availableYFields.push(this.orderYField);
    }

    //reset selection when objects change
    this.selectedXField = '';
    this.selectedYField = '';
    this.selectedChartType = '';
    this.selectedCompareField = '';
    this.onChartSelection();
  }

  alternativeCompareField(): string | null {
    if (this.selectedYField === 'Discounted Selling Price')
      return 'Selling Price';

    else if (this.selectedYField === 'Selling Price')
      return 'Discounted Selling Price';

    return null;
  }


  onYFieldChange() {
    this.selectedCompareField = null; // Un tick the radio button when Y-axis field changes
    this.onChartSelection();
  }

  //check the chart is pie chart or not
  shouldNotPieChart() {
    return this.selectedChartType == "Pie Chart"
  }

  fieldMapping: { [key: string]: keyof ChartDataType | 'orderedPeople' | 'averageRating' } = {
    "Products Name": "productName",
    "Selling Price": "sellingPrice",
    "Discounted Selling Price": "discountedSellingPrice",
    "Available Stock": "availableStock",
    "Discounts (%)": 'discount',
    "Ordered People": "orderedPeople",
    "Rating": "averageRating",
  }

  onChartSelection() {
    d3.select('#chartContainer').selectAll('*').remove(); // Clear previous chart

    if (this.selectedYField !== 'Selling Price' && this.selectedYField !== 'Discounted Selling Price') {
      this.selectedCompareField = null;
    }

    if (this.selectedChartType === 'Bar Chart' && this.selectedXField && this.selectedYField) {
      this.drawBarChart();
    } else if (this.selectedChartType === 'Line Chart' && this.selectedXField && this.selectedYField) {
      this.drawLineChart();
    }
    else if (this.selectedChartType === 'Pie Chart' && this.selectedYField) {
      this.drawPieChart();
    }
  }

  // Initialize SVG container
  initializeSVG(width: number, height: number, margin: { top: number, right: number, bottom: number, left: number }) {
    return d3.select("#chartContainer")
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("display", "block")
      .style("margin-top", "60px");
  }

  // Setup tooltip
  setupTooltip() {
    return d3.select("#chartContainer")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "6px 10px")
      .style("border-radius", "5px")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("text-align", "center")
      .style("visibility", "hidden")
      .style("pointer-events", "none");
  }

  // Setup legend
  setupLegend(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, width: number, margin: { top: any; right: any; bottom?: number; left?: number; }, yField: string, compareField: string | null = null) {
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "steelblue");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(yField);

    if (compareField) {
      legend.append("rect")
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "orange");

      legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text(compareField);
    }
  }


  // Setup axes
  setupAxes(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, xScale: d3.ScaleBand<string> | d3.ScalePoint<string>,
    yScale: d3.ScaleLinear<number, number>, height: number, margin: { top: number, right: number, bottom: number, left: number }) {

    svg.selectAll("g.axis").remove();

    svg.append('g')
      .attr("class", "axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-20)")
      .style("text-anchor", "end");

    svg.append('g')
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(6));
  }

  processChartData(xField: string, yField: string) {
    if (!this.chartData || !this.fieldMapping[xField] || !this.fieldMapping[yField]) return null;

    const xKey = this.fieldMapping[xField];
    const yKey = this.fieldMapping[yField];
    const compareKey = this.selectedCompareField ? this.fieldMapping[this.selectedCompareField] : null;

    //Filter based on the selected sub category name
    let filterData = this.chartData;
    if (this.selectedCombinedName) {
      filterData = this.chartData.filter((data: any) => data.combinedName === this.selectedCombinedName);
      console.log("filtered data ", filterData);

    }

    const processedData = filterData.map(d => ({
      xValue: d[xKey] ?? "Unknown",
      yValue: d[yKey] ?? 0,
      compareValue: compareKey ? d[compareKey] : null,
      orderedPeople: d.orderedPeople ?? 0

    }));

    /*
    const topOrderedData = processedData.sort((a, b) => b.orderedPeople - a.orderedPeople).slice(0, 10)
    SonarQube is giving the warning because .sort() changes the original array (processedData), which can 
    cause unintended issues elsewhere in your code.
    */
    const topOrderedData = processedData.slice().sort((a, b) => b.orderedPeople - a.orderedPeople)
      .slice(0, 10)

    console.log("processed data", topOrderedData);

    return topOrderedData;

  }



  drawBarChart() {
    const data = this.processChartData(this.selectedXField, this.selectedYField);
    if (!data) return;

    const container = d3.select("#chartContainer").node() as HTMLElement;
    const width = container?.getBoundingClientRect()?.width || 600;
    const height = 400;
    const margin = { top: 50, right: 30, bottom: 70, left: 50 };

    const svg = this.initializeSVG(width, height, margin);

    const xScale = d3.scaleBand()
      .domain(data.map(d => String(d.xValue)))
      .range([margin.left, width - margin.right])
      .padding(0.7);

    let yMax = d3.max(data, d => Number(d.yValue)) ?? 0;
    if (this.selectedCompareField) {
      const compareMax = d3.max(data, d => Number(d.compareValue)) ?? 0;
      yMax = Math.max(yMax, compareMax);
    }

    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    this.setupAxes(svg, xScale, yScale, height, margin);
    const tooltip = this.setupTooltip();

    // Bars for the main Y-field
    svg.selectAll(".bar-primary")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-primary")
      .attr("x", d => xScale(String(d.xValue)) ?? 0)  //xValue is the x label data which is in the processChartData()
      .attr("y", height - margin.bottom)              //fr animation, the y value initially at the bottom
      .attr("width", xScale.bandwidth() / (this.selectedCompareField ? 2 : 1))
      .attr("height", 0)
      .attr("fill", "steelblue")
      .transition()
      .duration(800)
      .attr("y", d => yScale(Number(d.yValue)))
      .attr("height", d => height - margin.bottom - yScale(Number(d.yValue)));

    // Bars for the comparison Y-field
    if (this.selectedCompareField) {
      svg.selectAll(".bar-compare")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-compare")
        .attr("x", d => (xScale(String(d.xValue)) ?? 0) + xScale.bandwidth() / 2)
        .attr("y", height - margin.bottom)
        .attr("width", xScale.bandwidth() / 2)
        .attr("height", 0)
        .attr("fill", "orange")
        .transition()
        .duration(800)
        .attr("y", d => yScale(Number(d.compareValue)))
        .attr("height", d => height - margin.bottom - yScale(Number(d.compareValue)));
    }

    // Tooltip
    svg.selectAll(".bar-primary, .bar-compare")
      .on("mouseover", (event, d: any) => {
        tooltip.style("visibility", "visible")
          .html(`${d.xValue} <br> 
            ${this.selectedYField}: ${d.yValue} <br>
             ${this.selectedCompareField ?? ''} ${d.compareValue ?? ''}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 40}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    this.setupLegend(svg, width, margin, this.selectedYField, this.selectedCompareField ?? null);
  }


  drawLineChart() {
    const data = this.processChartData(this.selectedXField, this.selectedYField);
    if (!data) return;

    const container = d3.select("#chartContainer").node() as HTMLElement;
    const width = container?.getBoundingClientRect()?.width || 600;
    const height = 400;
    const margin = { top: 50, right: 30, bottom: 70, left: 50 };

    const svg = this.initializeSVG(width, height, margin);

    const xScale = d3.scalePoint()
      .domain(data.map(d => String(d.xValue)))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    let yMax = d3.max(data, d => Number(d.yValue)) ?? 0;
    if (this.selectedCompareField) {
      const compareMax = d3.max(data, d => Number(d.compareValue)) ?? 0;
      yMax = Math.max(yMax, compareMax);
    }

    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    this.setupAxes(svg, xScale, yScale, height, margin);
    const tooltip = this.setupTooltip();

    // Line generator
    const lineGenerator = d3.line<any>()
      .x(d => xScale(String(d.xValue)) ?? 0)
      .y(d => yScale(Number(d.yValue)))
      .curve(d3.curveMonotoneX);

    // Draw the main line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);

    // Draw points on the main line
    svg.selectAll(".dot-primary")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot-primary")
      .attr("cx", d => xScale(String(d.xValue)) ?? 0)
      .attr("cy", d => yScale(Number(d.yValue)))
      .attr("r", 5)
      .attr("fill", "steelblue");

    // If a comparison field is selected, draw the second line
    if (this.selectedCompareField) {
      const compareLineGenerator = d3.line<any>()
        .x(d => xScale(String(d.xValue)) ?? 0)
        .y(d => yScale(Number(d.compareValue)))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", compareLineGenerator);

      // Draw points on the comparison line
      svg.selectAll(".dot-compare")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot-compare")
        .attr("cx", d => xScale(String(d.xValue)) ?? 0)
        .attr("cy", d => yScale(Number(d.compareValue)))
        .attr("r", 5)
        .attr("fill", "orange");
    }

    // Tooltip for both lines
    svg.selectAll(".dot-primary, .dot-compare")
      .on("mouseover", (event, d: any) => {
        tooltip.style("visibility", "visible")
          .html(`${d.xValue} <br> ${this.selectedYField}: ${d.yValue} <br> ${this.selectedCompareField ?? ''} ${d.compareValue || ''}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 40}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Add a legend for comparison
    this.setupLegend(svg, width, margin, this.selectedYField, this.selectedCompareField);
  }


  //draw pie chart
  drawPieChart() {
    this.selectedCompareField = null; // Un tick the radio button when Y-axis field changes
    if (!this.selectedYField) {
      d3.select("#chartContainer").select("svg").remove();
      return;
    }

    const yKey = this.fieldMapping[this.selectedYField];

    if (!yKey) {
      console.error("Invalid Field Mapping:", this.selectedYField);
      return;
    }

    const data = this.chartData.map(d => ({
      label: d[this.fieldMapping[this.selectedXField]] || "Unknown",
      value: d[yKey] || 0,
    }));

    const container = d3.select("#chartContainer").node() as HTMLElement;
    const width = container.getBoundingClientRect().width || 600;
    const height = 400;
    const margin = { top: 50, right: 30, bottom: 70, left: 50 };

    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.bottom) + 40;

    const svg = this.initializeSVG(width, height, margin);
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${width / 2 - 90}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie<{ label: string; value: number }>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const tooltip = this.setupTooltip();

    const arcs = chartGroup.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    // Animate the arcs
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i.toString()))
      .transition()
      .duration(1000) // Animation duration
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t: number) => arc(interpolate(t))!;
      });

    // Tooltip events
    arcs.on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .html(`${d.data.label} <br> ${d.data.value}`);
    })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 40}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 250}, ${margin.top - 50})`);

    const legendItemHeight = 20;
    const legendSpacing = 5;

    data.forEach((d, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * (legendItemHeight + legendSpacing)})`);

      legendItem.append("rect")
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", color(i.toString()));

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .style("font-size", "14px")
        .text(d.label);
    });
  }

}

