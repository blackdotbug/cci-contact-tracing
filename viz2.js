
// size legend code: https://bl.ocks.org/curran/ffcf1dac1f301cf7ec7559fa729b647f
// color legend code: https://observablehq.com/@d3/color-legend
// tooltip code: https://observablehq.com/@skofgar/force-directed-graph-integrated-html
// force directed layout code: https://bl.ocks.org/mapio/53fed7d84cd1812d6a6639ed7aa83868


d3.csv("contact_tracing.csv", d3.autoType).then(data => {
  let width = 950, height = 380;
  let margin = {top: 50, right: 80, bottom: 40, left: 60}
  let xvar = "ct_per_case"
  let colorvar = "staff_ct_bypop"
  let rvar = "cases_14_day_avg_bypop"
  let rscale = d3.scaleSqrt().domain(d3.extent(data.map(d => d[rvar]))).range([4, d3.max(data.map(d => d[rvar]))])
  let xScale = d3.scaleLinear().domain(d3.extent(data.map(d => d[xvar]))).range([margin.left, width-margin.right]);
  let yScale = d3.scaleLinear().domain(d3.extent(data.map(d => d[colorvar]))).range([height-margin.top-margin.bottom-40, 25])
  let color = d3.scaleSequential(d3.interpolateRdGy).domain(d3.extent(data.map(d => d[colorvar])))
  let x_axis = d3.axisBottom().scale(xScale)
  var viz = d3.select('#viz').append("svg").attr("width", width).attr("height", height)
    
  let container = viz.append("g").attr("transform", `translate(${margin.left},0)`)
  
  let node = container.selectAll("circle")
    .data(data)
    .enter()
    .append('circle')
    .attr('r', function(d) {
      return rscale(d[rvar]);
    })
    .style('fill', function(d) {
      return color(d[colorvar]);
    })
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip)

  let states = container.selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .text(d => d.stabr)
    .attr("dy", "5px")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("stroke-width", "0.25px")
    .style("stroke", "white")
    .style("cursor", "default")
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip)

  function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
  }

  function updateStates(states) {
    states.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
  }

  var simulation = d3.forceSimulation(data)
  .force('charge', d3.forceManyBody().strength(-15))
  .force('x', d3.forceX().x(function(d) {
    return xScale(d[xvar]);
  }))
  .force('y', d3.forceY().y(function(d) {
    return yScale(d[colorvar]);
  }))
  .force('collision', d3.forceCollide().radius(function(d) {
    return rscale(d[rvar]);
  }))
  .on('tick', ticked);

  function ticked() {
    node.call(updateNode);
    states.call(updateStates);
  }

  function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
  }

  let xG = viz.append("g").attr("class", "axis x-axis")
    .attr("transform", `translate(${margin.left},${height-margin.bottom})`)
    .attr("width", width)
    .attr("height",20)
    .call(x_axis)

  xG.append("g").attr("class", "x-label").attr("transform", `translate(${width/2},${margin.bottom-10})`)
    .append("text").text("Number of Contact Tracers Per Case").attr("fill", "black").style("font-weight","bold")

  legend({
    color: color,
    title: "Number of contact tracers per 100,000 inhabitants"
  })
  
  sizeLegend({
    sizeScale: rscale,
    orientation: "horizontal",
    boxwidth: 320,
    boxheight: 50,
    ticks: 5,
    tickFill: "black",
    tickSpacing: 50,
    tickPadding: 37,
    label: "Average daily number of COVID-19 cases during the last 14 days per 100,000 inhabitants",
    labelX: -20,
    labelY: -30
  });

  // add html content to tooltip
  function loadTooltipContent(d) {
    var htmlContent = `<h4>${d.state}</h4>
                        <p>Number of contact tracers: ${d3.format(",")(d.staff_ct)}</p>
                        <p>Average daily number of COVID-19 cases during the last 14 days: ${d3.format(",")(Math.ceil(d.cases_14_day_avg))}</p>
                        <p>Contact tracers per case: ${d3.format(".2f")(d.ct_per_case)}</p>`
    tooltip.html(htmlContent);
  }

  // add tooltip to HTML body
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("z-index", "10")
    .style("width", "230px")
    .style("height", "115px")
    .style("background-color", "rgba(230, 242, 255, 0.8)")
    .style("border-radius", "5px")
    .style("visibility", "hidden")
    .text("");

  function showTooltip(node) {
    loadTooltipContent(d3.select(this).data()[0])
    tooltip.style("top", (node.pageY -10) + "px").style("left", (node.pageX + 10) + "px").style("visibility", "visible");
  }

  function hideTooltip(node) {
    tooltip.style("visibility", "hidden")
  }
})

function sizeLegend(props){
    const sizeScale = props.sizeScale;
    const orientation = props.orientation;
    const boxwidth = props.boxwidth;
    const boxheight = props.boxheight;
    const ticksCount = props.ticks;
    const tickFill = props.tickFill;
    const tickSpacing = props.tickSpacing;
    const tickPadding = props.tickPadding;
    const label = props.label;
    const labelX = props.labelX;
    const labelY = props.labelY;
    
    let selection = d3.select("#legends").append("svg")
      .attr("class", "legend")
      .attr("width", boxwidth)
      .attr("height", boxheight)
      .style("overflow", "visible")
      .style("display", "inline-block");

    let legendG = selection
      .selectAll(".legend--size")
      .data([null]);
    legendG = legendG
      .enter().append("g")
        .attr("class", "legend legend--size")
        .style("font-size", "10")
        .style("font-family", "sans-serif")
    
    // let longlabel = label.split(" ")
    // checking.splice(0,Math.ceil(checking.length/2)),checking.splice(-Math.ceil(checking.length/2))
    // let line1 = longlabel.splice(0,Math.ceil(longlabel.length/2))
    // let line2 = longlabel.splice(-Math.ceil(longlabel.length/2))
    const legendLabel = legendG
      .selectAll(".legend__label")
      .data([null]);
    const legendtxt = legendLabel
      .enter().append("text")
        .attr("class", "legend__label")
        .style("font-weight", "bold")
      .merge(legendLabel)
        
    legendtxt.append("tspan")
        .text("Average daily number of COVID-19 cases during")
        .attr("x", labelX)
        .attr("y", labelY);
    legendtxt.append("tspan")
        .text("the last 14 days per 100,000 inhabitants")
        .attr("x", labelX)
        .attr("y", labelY/2);
    
    const ticks = legendG
      .selectAll(".tick")
      .data(sizeScale.ticks(ticksCount).filter(d => d));
    const ticksEnter = ticks
      .enter().append("g")
        .attr("class", "tick");
    ticksEnter
      .merge(ticks)
        .attr("transform", (d, i) => orientation == "vertical"? `translate(0, ${i * tickSpacing})` : `translate(${i * tickSpacing}, 20)`);
    ticks.exit().remove();
    
    ticksEnter
      .append("circle")
      .merge(ticks.select("circle"))
        .attr("r", sizeScale)
        .attr("fill", tickFill);
    
    ticksEnter
      .append("text")
      .merge(ticks.select("text"))
        .style("text-anchor", "middle")
        .attr("x", orientation == "vertical" ? tickPadding : 0)
        .attr("y", orientation == "vertical" ? 0 : tickPadding)
        .text(d => d);
}

function legend({
    color,
    title,
    tickSize = 6,
    width = 320, 
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
  } = {}) {
  
    const leg = d3.select("#legends").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "legend")
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "inline-block");
  
    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;
  
    // Continuous
    if (color.interpolate) {
      const n = Math.min(color.domain().length, color.range().length);
  
      x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
  
      leg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }
  
    // Sequential
    else if (color.interpolator) {
      x = Object.assign(color.copy()
          .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
          {range() { return [marginLeft, width - marginRight]; }});
  
      leg.append("image")
          .attr("class", "seqLegImg")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height *45)
        //   .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", ramp(color.interpolator()).toDataURL());
  
      // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }
  
    // Threshold
    else if (color.invertExtent) {
      const thresholds
          = color.thresholds ? color.thresholds() // scaleQuantize
          : color.quantiles ? color.quantiles() // scaleQuantile
          : color.domain(); // scaleThreshold
  
      const thresholdFormat
          = tickFormat === undefined ? d => d
          : typeof tickFormat === "string" ? d3.format(tickFormat)
          : tickFormat;
  
      x = d3.scaleLinear()
          .domain([-1, color.range().length - 1])
          .rangeRound([marginLeft, width - marginRight]);
  
      leg.append("g")
        .selectAll("rect")
        .data(color.range())
        .join("rect")
          .attr("x", (d, i) => x(i - 1))
          .attr("y", marginTop)
          .attr("width", (d, i) => x(i) - x(i - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", d => d);
  
      tickValues = d3.range(thresholds.length);
      tickFormat = i => thresholdFormat(thresholds[i], i);
    }
  
    // Ordinal
    else {
      x = d3.scaleBand()
          .domain(color.domain())
          .rangeRound([marginLeft, width - marginRight]);
  
      leg.append("g")
        .selectAll("rect")
        .data(color.domain())
        .join("rect")
          .attr("x", x)
          .attr("y", marginTop)
          .attr("width", Math.max(0, x.bandwidth() - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", color);
  
      tickAdjust = () => {};
    }
  
    leg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(title));
  
    return leg.node();
  }

  function ramp(color, n = 256) {
    let el = document.querySelector(".seqLegImg")
    const canvas = el.parentNode.appendChild(document.createElement("canvas"))
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }