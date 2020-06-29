import React, { Component } from "react";
import * as d3 from "d3";
class Labels extends Component {
  state = {};
  isVisibleEndNode = (node) => {
    return (
      (this.props.tree.is_leafnode(node) || node["own-collapse"]) &&
      d3.layout.phylotree.is_node_visible(node)
    );
  };
  componentDidUpdate(prevProps, prevState) {
    let div = d3.select("#tooltip");

    let props = this.props;
    let shownNodes = props.tree
      .get_nodes()
      .filter((node) => this.isVisibleEndNode(node))
      .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));
    let yScale = d3.scale.ordinal().domain(shownNodes).rangeBands([0, this.container.offsetHeight]);
    let cellHeight = this.container.offsetHeight / shownNodes.length;
    let yAxis = d3.svg
      .axis()
      .scale(yScale)
      .tickFormat((d) => d)
      .orient("left");
    let svg = d3.select("#container-labels");
    let ticks = svg
      .select(".y.axis")
      // .attr("height", this.container.offsetHeight * 0.95)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .style("font-size", `${Math.min(cellHeight, 12)}px`)
      .style("cursor", "default")
      .attr("dy", ".35em")
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
      .attr("x1", (d, i) => -1 * textWidth[i] - 15)
      .attr("x2", -2 * this.container.offsetWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style(guideStyle);
    ticks
      .append("line")
      .attr("class", (d) => `guides node-${d}`)
      .attr("x1", 0)
      .attr("x2", 2 * this.container.offsetWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style(guideStyle);
  }

  componentDidMount() {
    let svg = d3.select(this.SVGLabels).append("g").attr("id", "container-labels");
    svg
      .append("g")
      .attr("class", "y axis")
      .attr("height", this.container.offsetHeight)

      .attr("transform", `translate(${[this.container.offsetWidth, 0]})`);
  }
  render() {
    return (
      <div
        style={{ width: "10%", height: "100%" }}
        id={this.props.divID}
        ref={(el) => (this.container = el)}
      >
        <svg
          style={{ width: "100%", height: "100%" }}
          id={`display_${this.props.divID}`}
          ref={(el) => (this.SVGLabels = el)}
        />
      </div>
    );
  }
}

export default Labels;
