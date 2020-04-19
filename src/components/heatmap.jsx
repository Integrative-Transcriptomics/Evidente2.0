import React, { Component } from "react";
import * as d3 from "d3";
import * as d3v5 from "d3v5";
import * as boxplot from "d3-boxplot";
import * as $ from "jquery";
import * as _ from "lodash";
class Heatmap extends Component {
  state = {};
  shouldComponentUpdate(nextProp, nextState) {
    let actualProp = this.props;
    let actualState = this.state;
    let actualHiddenNodes = actualProp.hiddenNodes;
    let newHiddenNodes = nextProp.hiddenNodes;
    let actualCollapsedClades = actualProp.collapsedClades;
    let newCollapsedClades = nextProp.collapsedClades;
    let actualSelectedNodes = actualProp.selectedNodes;
    let newSelectedNodes = nextProp.selectedNodes;
    let actualNodes = actualProp.nodes || [];
    let newNodes = nextProp.nodes || [];
    let newVisualized = nextProp.visMd || [];
    let actualVisualized = actualProp.visMd || [];
    if (
      newVisualized.length !== 0 ||
      actualNodes.length !== newNodes.length ||
      actualHiddenNodes.length !== newHiddenNodes.length ||
      actualCollapsedClades.length !== newCollapsedClades.length ||
      actualSelectedNodes.length !== newSelectedNodes.length
    ) {
      return true;
    } else if (!nextState.taxadata) {
      return false;
    } else {
      return false;
    }
  }
  componentDidUpdate(prevProp, prevState) {
    let state = this.state;
    let itemSize = this.state.itemSize;
    let cellSize = itemSize - 0.5;
    let props = this.props;
    let filteredData = props.taxadata;
    let container = d3.select("#heatmap-container");
    let shownNodes = this.props.tree
      .get_nodes()
      .filter((node) => this.isVisibleEndNode(node))
      .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));
    if (props.collapsedClades.length !== 0 || false) {
      itemSize = 40;
      cellSize = itemSize - 0.5;
      filteredData = this.clusterData(
        filteredData,
        props.collapsedClades,
        props.mdinfo
      );
    }
    // if (props.hiddenNodes.length !== 0 || false) {
    //   // let namesHiddenNodes = props.hiddenNodes.map(({ name }) => name);

    // }

    if (this.props.nodes && !prevProp.nodes) {
      this.initHeatmap(container);
    } else if (
      this.props.visMd.length !== 0 ||
      prevProp.hiddenNodes.length !== 0 ||
      prevProp.collapsedClades.length !== 0 ||
      shownNodes.length !== this.props.nodes.length
    ) {
      filteredData = filteredData.filter(({ Information }) =>
        shownNodes.includes(Information)
      );
      let x_elements = [
          ...new Set(
            this.props.visMd.concat(this.props.visSNPs.map((d) => `SNP:${d}`))
          ),
        ],
        y_elements = shownNodes;

      let xScale = d3.scale
        .ordinal()
        .domain(x_elements)
        .rangeBands([0, x_elements.length * itemSize]);

      let xAxis = d3.svg
        .axis()
        .scale(xScale)
        .tickFormat((d) => d)
        .orient("top");

      let yScale = d3.scale
        .ordinal()
        .domain(y_elements)
        .rangeBands([0, state.height]);

      let yAxis = d3.svg
        .axis()
        .scale(yScale)
        .tickFormat((d) => d)
        .orient("left");

      let cellHeight = state.height / y_elements.length - 1;

      container
        .selectAll("g.y.axis")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", `${Math.min(cellHeight, 12)}px`)
        .attr("dy", ".35em");

      container
        .selectAll("g.x.axis")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".5em")
        .attr("transform", (d) => "rotate(-65)");

      let elements = container.selectAll(`.cell, .boxplot, .histo`).remove(); //remove before new creation

      if (filteredData.length !== 0 && x_elements.length !== 0) {
        x_elements.forEach((md_name) => {
          this.updateCells(
            filteredData.filter((d) => !_.get(d, "clade", false)),
            cellHeight,
            xScale,
            yScale,
            props.mdinfo[md_name].colorScale,
            cellSize,
            md_name
          );
          let dataDomain = props.mdinfo[md_name].extent;
          let onlyClusters = filteredData.filter(({ clade }) => clade);
          if (props.mdinfo[md_name].type.toLowerCase() === "numerical") {
            let centering = cellHeight / 4;
            this.createBoxplots(
              onlyClusters,
              xScale,
              yScale,
              cellHeight,
              centering,
              dataDomain,
              md_name,
              itemSize
            );
          } else {
            this.createHistogram(
              onlyClusters,
              xScale,
              yScale,
              cellHeight,
              dataDomain,
              md_name,
              itemSize,
              props.mdinfo[md_name].colorScale
            );
          }
        });
      }
    }
    this.highlight_leaves(this.props.selectedNodes);
  }

  isVisibleEndNode = (node) => {
    return (
      (this.props.tree.is_leafnode(node) || node["own-collapse"]) &&
      d3.layout.phylotree.is_node_visible(node)
    );
  };

  clusterData(filteredData, actualClades, mdinfo) {
    let allAggregatedData = [];
    let hiddenLeaves = [];

    actualClades = actualClades.sort(
      // sort to avoid the showing of smaller clusters that are already hidden
      (a, b) => b.cladeLeaves.length - a.cladeLeaves.length
    );
    actualClades.forEach((actualClade) => {
      let leavesNames = actualClade.cladeLeaves.map(({ name }) => name);
      if (leavesNames.every((n) => hiddenLeaves.includes(n))) {
        return; // this cluster is already included in another one
      }

      hiddenLeaves = hiddenLeaves.concat(leavesNames);

      let leavesToAggregate = filteredData.filter(({ Information }) =>
        leavesNames.includes(Information)
      );
      let joinLeavesInformation = _.mergeWith(
        {},
        ...leavesToAggregate,
        (a, b) => (a || []).concat(b)
      );
      let aggregatedData = _.mapValues(joinLeavesInformation, (v, k) =>
        mdinfo[k].type.toLowerCase() === "numerical"
          ? boxplot.boxplotStats(v)
          : mdinfo[k].type.toLowerCase() === "categorical"
          ? _.countBy(v)
          : actualClade.showname
      );
      aggregatedData["clade"] = true;

      allAggregatedData = [...allAggregatedData, aggregatedData];
    });

    return [...allAggregatedData, ...filteredData];
    // .slice()
    // .sort((a, b) => d3.ascending(a.order, b.order));
  }

  updateCells(data, cellHeight, xScale, yScale, colorScale, cellSize, type) {
    let div = d3.select("#tooltip");
    d3.select("#heatmap-container")
      .selectAll(`.cell.md-${type}`)
      .data(data)
      .enter()
      .append("svg:rect")
      .attr("class", ({ Information }) => `cell ${Information} md-${type}`)
      .attr("width", cellSize)
      .attr("height", cellHeight)
      .attr("y", ({ Information }) => yScale(Information))
      .attr("x", () => xScale(type))
      .attr("fill", (d) => colorScale(d[type]))
      .on("mouseover", function (d) {
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html(typeof d[type] === "number" ? d[type].toFixed(3) : d[type])
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        div.transition().duration(500).style("opacity", 0);
      });
  }

  createBoxplots(
    data,
    xScale,
    yScale,
    cellHeight,
    center,
    data_extent,
    type,
    itemSize
  ) {
    let boxplot_x = d3v5.scaleLinear().domain(data_extent).range([0, itemSize]);

    d3v5
      .select("#heatmap-container")
      .selectAll(".boxplot.md-" + type)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `boxplot ${Information} md-${type}`)
      .attr(
        "transform",
        ({ Information }) =>
          `translate(${xScale(type)}, ${center + yScale(Information)})`
      )
      .datum((d) => d[type])
      .call(
        boxplot
          .boxplot()
          .bandwidth(cellHeight / 2)
          .boxwidth(cellHeight / 2)
          .scale(boxplot_x)
          .showInnerDots(false)
          .symbol(boxplot.boxplotSymbolTick)
          .jitter(1)
          .opacity(1)
      );
  }

  createHistogram(
    data,
    xScale,
    yScale,
    cellHeight,
    dataDomain,
    type,
    itemSize,
    colorScale
  ) {
    let max = d3.max(
      data.reduce((acc, d) => [...acc, ...Object.values(d[type])], [])
    );
    let heatmapCell = d3
      .select("#heatmap-container")
      .selectAll(`.histo.md-${type}`)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `histo ${Information} md-${type}`)
      .attr(
        "transform",
        ({ Information }) =>
          `translate(${xScale(type)}, ${yScale(Information)})`
      );
    let bars = heatmapCell
      .selectAll(`.bars.md-${type}`)
      .data((d) => Object.entries(d[type]))
      .enter()
      .append("rect")
      .attr("class", `.bars.md-${type}`)
      .attr("fill", (d) => colorScale(d[0]));
    let xScaleBar = d3.scale
      .ordinal()
      .domain(dataDomain)
      .rangeBands([0, itemSize]);
    let yScaleBar = d3.scale.linear().domain([0, max]).range([cellHeight, 0]);
    let barWidth = itemSize / dataDomain.length;
    bars
      .attr("x", (d) => xScaleBar(d[0]))
      .attr("y", (d) => yScaleBar(d[1]))
      .attr("width", barWidth)
      .attr("height", (d) => cellHeight - yScaleBar(d[1]));
  }

  highlight_leaves(selection = []) {
    if (selection.length === 0) {
      $(".cell, .boxplot, .histo").css("opacity", 1); // Nothing selected, everythin bold
    } else {
      $(".cell, .boxplot, .histo").css("opacity", 0.2);
      selection.forEach((t) => {
        let lookFor = t.collapsed ? t["show-name"] : t.name; // Either clade or leaf
        $(`.${lookFor}`).css("opacity", 1);
      });
    }
  }

  getMetadataInformation(data) {
    let temp = data.reduce((acc, d) => {
      let { metadata, type, value } = d;
      return {
        ...acc,
        [metadata]: {
          ...(acc[metadata] || {}),
          type: type,
          values: [...(acc[metadata] || { values: [] })["values"], value],
        },
      };
    }, {});

    temp = Object.entries(temp).map((e) => {
      let k = e[0];
      let { values, ...others } = e[1];
      return {
        key: k,
        ...others,
        extent:
          others.type === "numerical"
            ? d3.extent(values)
            : d3.set(values).values(),
      };
    });

    temp = temp.reduce((acc, { key, ...otherAttrs }) => {
      return { ...acc, [key]: { ...otherAttrs } };
    }, {});
    return temp;
  }

  initHeatmap(container) {
    let leaf_nodes = (this.props.nodes || []).filter(
      d3.layout.phylotree.is_leafnode
    );
    let height = this.state.height;
    let itemSize = this.state.itemSize;
    let cellSize = this.state.cellSize;
    // let data = [];
    // let metadataInformation = {};
    // data = leaf_nodes.map((item, it) => {
    //   let newItem = {};
    //   newItem.taxa = item.name;
    //   newItem.order = it;
    //   newItem.type = "numerical";
    //   newItem.metadata = "leaf_nodes";
    //   newItem.value = Math.random();
    //   // if (Math.random() < 0.75) return undefined;

    //   return newItem;
    // });

    // data = data.concat(
    //   leaf_nodes.map((item, it) => {
    //     let newItem = {};
    //     newItem.taxa = item.name;
    //     newItem.order = it;
    //     newItem.type = "numerical";
    //     newItem.metadata = "second";
    //     newItem.value = Math.random() * 10;
    //     // if (Math.random() < 0.75) return undefined;

    //     return newItem;
    //   })
    // );

    // data = data.concat(
    //   leaf_nodes.map((item, it) => {
    //     let newItem = {};
    //     newItem.taxa = item.name;
    //     newItem.order = it;
    //     newItem.type = "categorical";
    //     newItem.metadata = "SNP";
    //     newItem.value = _.sample(["A", "C", "G", "T", "N"]);
    //     if (Math.random() < 0.75) return undefined;
    //     return newItem;
    //   })
    // );
    // data = data
    //   .concat(
    //     leaf_nodes.map((item, it) => {
    //       let newItem = {};
    //       newItem.taxa = String(item.name);
    //       newItem.order = it;
    //       newItem.type = "categorical";
    //       newItem.metadata = "3";
    //       newItem.value = _.sample(["A", "C", "G", "T", "N"]);
    //       // if (Math.random() < 0.75) return undefined;
    //       return newItem;
    //     })
    //   )
    //   .filter((d) => d);

    // metadataInformation = this.getMetadataInformation(data);

    // let x_elements = d3v5.set(data.map(({ metadata }) => metadata)).values(),
    let x_elements = d3v5
        .set(this.props.visMd.concat(this.props.visSNPs.map((d) => `SNP:${d}`)))
        .values(),
      y_elements = leaf_nodes.map(({ name }) => `${String(name)}`);
    let cellHeight = height / y_elements.length - 1;

    let xScale = d3.scale
      .ordinal()
      .domain(x_elements)
      .rangeBands([0, x_elements.length * itemSize]);

    let xAxis = d3.svg
      .axis()
      .scale(xScale)
      .tickFormat((d) => d)
      .orient("top");
    let yScale = d3.scale.ordinal().domain(y_elements).rangeBands([0, height]);

    let yAxis = d3.svg
      .axis()
      .scale(yScale)
      .tickFormat((d) => d)
      .orient("left");

    container
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", `${Math.min(cellHeight, 12)}px`)
      .attr("dy", ".35em")
      .attr("font-weight", "normal");

    container
      .append("g")
      .attr("class", "x axis")
      .call(xAxis)
      .selectAll("text")
      .attr("font-weight", "normal")
      .style("text-anchor", "start")
      .attr("dx", ".8em")
      .attr("dy", ".5em")
      .attr("transform", (d) => "rotate(-65)");

    let ticks = d3.selectAll(".tick text");
    ticks.attr("class", (d) => d);

    // x_elements.forEach((md_name) => {
    //   let div = d3.select("#tooltip");
    //   let data_metadata = data.filter((d) => d.metadata === md_name);
    //   let colorScale =
    //     metadataInformation[md_name].type === "numerical"
    //       ? d3.scale
    //           .linear()
    //           .domain(metadataInformation[md_name].extent)
    //           .range(["blue", "red"])
    //       : d3.scale
    //           .ordinal()
    //           .domain(metadataInformation[md_name].extent)
    //           .range(["black", "red", "blue", "green", "yellow"]);

    //   metadataInformation[md_name].colorScale = colorScale;

    //   let cells = container
    //     .selectAll(`.cell.md-${md_name}`)
    //     .data(data_metadata, ({ taxa }) => taxa)
    //     .enter()
    //     .append("rect")
    //     .attr("class", ({ taxa }) => `cell ${taxa} md-${md_name}`)
    //     .attr("width", cellSize)
    //     .attr("height", cellHeight)
    //     .attr("y", ({ taxa }) => yScale(taxa))
    //     .attr("x", ({ metadata }) => xScale(metadata))
    //     .attr("fill", ({ value }) => colorScale(value))
    //     .on("mouseover", function (d) {
    //       div.transition().duration(200).style("opacity", 0.9);
    //       div
    //         .html(typeof d.value === "number" ? d.value.toFixed(3) : d.value)
    //         .style("left", d3.event.pageX + "px")
    //         .style("top", d3.event.pageY - 28 + "px");
    //     })
    //     .on("mouseout", function (d) {
    //       div.transition().duration(500).style("opacity", 0);
    //     });
    // });

    this.setState({
      yScale: yScale,
      xScale: xScale,
      // metadataInformation: metadataInformation,
      // data: data,
    });
  }

  componentDidMount() {
    let margin = { top: 0, right: 20, bottom: 0, left: 250 };

    let width = this.container.offsetWidth - margin.right - margin.left,
      height = this.container.offsetHeight - margin.top - margin.bottom;

    let itemSize = 10;
    let cellSize = itemSize - 0.5;

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "tooltip")
      .style("opacity", 0);
    let svg = d3
      .select("#heatmap_viz")
      .append("svg")
      .attr("id", "display_heatmap")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate( ${margin.left}, ${margin.top})`);

    let container = svg.append("g").attr("id", "heatmap-container");

    this.setState({
      height: height,

      cellSize: cellSize,
      itemSize: itemSize,
    });
  }

  render() {
    return (
      <div
        id="heatmap_viz"
        className="mchild"
        ref={(el) => (this.container = el)}
      ></div>
    );
  }
}

export default Heatmap;
