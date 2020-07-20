import React, { Component } from "react";
import * as d3 from "d3";
import { isEqual } from "lodash";

class Labels extends Component {
  state = {};
  globalHeight = 0;
  globalWidth = 0;

  // componentDidUpdate(prevProps, prevState) {

  // }
  shouldComponentUpdate(nextProp, nextState) {
    let oldNodes = this.props.shownNodes;
    let newNodes = nextProp.shownNodes;
    return !isEqual(newNodes, oldNodes);
  }
  componentDidUpdate(prevProps, prevState) {
    // To check what changed
    Object.entries(this.props).forEach(
      ([key, val]) => prevProps[key] !== val && console.log(`Prop '${key}' changed`)
    );
    if (this.state) {
      Object.entries(this.state).forEach(
        ([key, val]) => prevState[key] !== val && console.log(`State '${key}' changed`)
      );
    }

    let margin_top = this.globalHeight * 0.05;

    d3.select("#adds-margin").attr("transform", `translate(${[0, margin_top]})`);

    let div = d3.select("#tooltip");
    let height = this.globalHeight;
    let props = this.props;
    let shownNodes = props.shownNodes;
    let yScale = d3.scale
      .ordinal()
      .domain(shownNodes)
      .rangeBands([0, height - margin_top]);
    let cellHeight = (height - margin_top) / shownNodes.length;
    let yAxis = d3.svg
      .axis()
      .scale(yScale)
      .tickFormat((d) => d)
      .orient("left");
    let svg = d3.select("#container-labels");
    let ticks = svg
      .select(".own-label.y.axis")
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .style("font-size", `${Math.min(cellHeight, 12)}px`)
      .style("cursor", "default")
      .selectAll(".tick");

    ticks
      .selectAll("text")
      .classed("noselect", true)
      .on("mouseover", (d) => {
        d3.selectAll(`.node-${d}.guides`).classed("highlighted-guide", true);
        div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
        div
          .html(d)
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", (d) => {
        d3.selectAll(`.node-${d}.guides`).classed("highlighted-guide", false);
        div.transition().duration(500).style("opacity", 0);
      });

    let textWidth = [];
    let textMargin = 15;
    ticks.selectAll("text").each(function () {
      var thisWidth = this.getComputedTextLength();
      textWidth.push(thisWidth);
    });
    ticks.selectAll("line").remove();
    let guideStyle = {
      stroke: "grey",
      "stroke-dasharray": "10,3",
      "stroke-opacity": 0.25,
    };
    ticks
      .append("line")
      .attr("class", (d) => `guides node-${d}`)
      .attr("x1", (d, i) => -1 * textWidth[i] - textMargin)
      .attr("x2", -2 * this.globalWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style(guideStyle);
    ticks
      .append("line")
      .attr("class", (d) => `guides node-${d}`)
      .attr("x1", 0)
      .attr("x2", 2 * this.globalWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style(guideStyle);
    let container = d3.select(`#container-labels`);

    const dragLabels = d3.behavior.drag().on("drag", () => {
      let t = d3.transform(container.attr("transform"));
      let intendedDrag = t.translate[0] + d3.event.dx;
      let diffWidths = Math.max(...textWidth) + textMargin - this.globalWidth;
      container.attr(
        "transform",
        `translate( ${Math.max(
          Math.min(intendedDrag, t.scale[0] * Math.max(diffWidths, 0)),
          t.scale[0] *
            Math.min(diffWidths, (-t.scale[0] * this.globalWidth) / 2 + this.globalWidth / 2)
        )}, ${t.translate[1]})scale(${t.scale})`
      );
    });
    d3.select(`#display_${this.props.divID}`).call(this.props.onZoom).call(dragLabels);
  }

  componentDidMount() {
    let svg = d3
      .select(`#${this.props.divID}`)
      .append("svg")
      .attr("width", this.container.offsetWidth)
      .attr("height", this.container.offsetHeight)
      .attr("id", `display_${this.props.divID}`)
      .append("g")
      .attr("id", "adds-margin")
      .append("g")
      .attr("id", "container-labels");

    svg
      .append("g")
      .attr("class", " own-label y axis")
      .attr("transform", `translate(${[this.container.offsetWidth, 0]})`);

    this.globalHeight = this.container.offsetHeight;
    this.globalWidth = this.container.offsetWidth;
    let margin_top = this.globalHeight * 0.05;

    d3.select("#adds-margin").attr("transform", `translate(${[0, margin_top]})`);
  }
  render() {
    return (
      <div id={this.props.divID} className='labels-child' ref={(el) => (this.container = el)}></div>
    );
  }
}

export default Labels;
