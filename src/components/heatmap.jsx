import React, { Component } from "react";
import * as d3 from "d3";
import * as d3v5 from "d3v5";
import * as boxplot from "d3-boxplot";
import * as $ from "jquery";
import * as _ from "lodash";
class Heatmap extends Component {
  state = {};
  SNPcolorScale = d3.scale
    .ordinal()
    .domain(["A", "C", "T", "G", "N"])
    .range(["red", "yellow", "blue", "green", "purple"]);

  SNPprefix = "SNP_Pos_";
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
    let newVisualizedSNPs = nextProp.visSNPs || [];
    let actualVisualizedSNPs = actualProp.visSNPs || [];
    if (
      newVisualized.length !== actualVisualized.length ||
      actualVisualizedSNPs.length !== newVisualizedSNPs.length ||
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
    let props = this.props;

    let itemSize = state.itemSize;
    let cellSize = itemSize - 0.5;
    let filteredData = props.taxadata;

    let reducedSupportSNPs = (props.snpdata.support || []).filter(({ pos }) =>
      props.visSNPs.includes(pos)
    );
    let reducedNotSupportSNPs = (props.snpdata.notsupport || []).filter(({ pos }) =>
      props.visSNPs.includes(pos)
    );
    let modifiedSNPData = this.modifySNPs(reducedSupportSNPs, props.ids.labToNum);
    modifiedSNPData = modifiedSNPData.concat(
      this.modifySNPs(reducedNotSupportSNPs, props.ids.labToNum, true)
    );
    let mergedSNPs = modifiedSNPData.reduce((acc, cur) => {
      let obj = acc.find((d) => d.Information === cur.Information) || {};
      let filteredOutput = acc.filter((d) => d.Information !== cur.Information);
      return [...filteredOutput, { ...obj, ...cur }];
    }, []);

    let container = d3.select(`#${this.props.containerID}`);
    let shownNodes = props.tree
      .get_nodes()
      .filter((node) => this.isVisibleEndNode(node))
      .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));
    if (props.collapsedClades.length !== 0 || false) {
      itemSize = 40;
      cellSize = itemSize - 0.5;
      filteredData = this.clusterData(
        filteredData,
        props.collapsedClades,
        this.clusterMetadata,
        props.mdinfo
      );

      mergedSNPs = this.clusterData(mergedSNPs, props.collapsedClades, this.clusterSNPs);
    }
    // if (props.hiddenNodes.length !== 0 || false) {
    //   // let namesHiddenNodes = props.hiddenNodes.map(({ name }) => name);

    // }

    if (props.nodes && !prevProp.nodes) {
      this.initHeatmap(container);
    } else if (
      // prevProp.hiddenNodes.length !== 0 ||
      // prevProp.collapsedClades.length !== 0 ||
      shownNodes.length !== this.props.nodes.length
    ) {
      filteredData = filteredData.filter(({ Information }) => shownNodes.includes(Information));
      mergedSNPs = mergedSNPs.filter(({ Information }) => shownNodes.includes(Information));

      let x_elements = this.props.visSNPs
          .map((d) => `${this.SNPprefix}${d}`)
          .concat([...this.props.visMd]),
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

      let yScale = d3.scale.ordinal().domain(y_elements).rangeBands([0, state.height]);

      let yAxis = d3.svg
        .axis()
        .scale(yScale)
        .tickFormat((d) => d)
        .orient("left");

      let cellHeight = state.height / y_elements.length - 1;

      container
        .selectAll("g.y.axis")
        .call(yAxis)
        .call((g) => g.select(".domain").remove())
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

      let ticks = d3.select(".y").selectAll(".tick");

      let elements = container
        .selectAll(`.cell, .boxplot, .histo, .pattern, .guides, .division-line`)
        .remove(); //remove before new creation

      ticks
        .append("line")
        .attr("class", "guides")
        .attr("x1", (d) => -1 * d.length * Math.min(cellHeight, 12))
        .attr("x2", -9000)
        .attr("y1", 0)
        .attr("y2", 0)
        .style("stroke", "grey")
        .style("stroke-dasharray", "10,3")
        .style("stroke-opacity", 0.25); // colour the line;

      x_elements.forEach((md_name) => {
        let typeOfMD = _.get(props.mdinfo, `${md_name}.type`, "").toLowerCase();
        let nonClusteredInformation = (md_name.includes(this.SNPprefix)
          ? mergedSNPs
          : filteredData
        ).filter((d) => !_.get(d, "clade", false));
        this.updateCells(
          nonClusteredInformation,
          cellHeight,
          xScale,
          yScale,
          (props.mdinfo[md_name] || { colorScale: this.SNPcolorScale }).colorScale,
          cellSize,
          md_name,
          md_name.includes(this.SNPprefix),
          typeOfMD === "numerical"
        );
        let dataDomain = _.get(props.mdinfo, `${md_name}.extent`, ["A", "C", "T", "G", "N"]);
        let onlyClusters = (md_name.includes(this.SNPprefix) ? mergedSNPs : filteredData).filter(
          ({ clade }) => clade
        );
        if (typeOfMD === "numerical") {
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
            _.get(props.mdinfo, `${md_name}.colorScale`, this.SNPcolorScale),
            md_name.includes(this.SNPprefix)
          );
        }
        if (md_name === `${this.SNPprefix}${_.last(props.visSNPs)}`) {
          container
            .append("line")
            .attr("class", "division-line")
            .attr({
              x1: itemSize * props.visSNPs.length,
              x2: itemSize * props.visSNPs.length,
              y1: 0,
              y2: state.height,
            })
            .style("stroke", "black")
            .style("stroke-width", "1.5px")
            .style("stroke-dasharray", "10,3")
            .style("stroke-opacity", 1);
        }
      });
    }
    this.highlight_leaves(this.props.selectedNodes);
  }

  isVisibleEndNode = (node) => {
    return (
      (this.props.tree.is_leafnode(node) || node["own-collapse"]) &&
      d3.layout.phylotree.is_node_visible(node)
    );
  };

  modifySNPs = (SNPdata, labelToID, notSupport = false) => {
    let nodes = this.props.tree.get_nodes();
    let mappedSNPs = SNPdata.map((SNP) => {
      let actualID = labelToID[SNP.node];
      let actualPos = SNP.pos;
      let actualAllele = SNP.allele;
      let node = nodes.find(({ tempid }) => {
        return String(tempid) === actualID;
      });

      return this.props.tree
        .descendants(node)
        .filter(this.props.tree.is_leafnode)
        .map(({ name }) => ({
          Information: name,
          [actualPos]: { allele: actualAllele, notsupport: notSupport },
        }));
    });
    let flattenSNPs = _.flatten(mappedSNPs);

    return flattenSNPs;
  };

  clusterData(data, actualClades, clusterMethod, mdinfo = {}) {
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

      let metadataToAggregate = data.filter(({ Information }) => leavesNames.includes(Information));

      let jointMetadataInformation = _.mergeWith({}, ...metadataToAggregate, (a, b) =>
        (a || []).concat(b)
      );
      let aggregatedData = _.mapValues(jointMetadataInformation, (v, k) =>
        clusterMethod(v, k, mdinfo, actualClade)
      );
      aggregatedData["clade"] = true;

      allAggregatedData = [...allAggregatedData, aggregatedData];
    });

    return [...allAggregatedData, ...data];
  }

  updateCells(data, cellHeight, xScale, yScale, colorScale, cellSize, type, isSNP, isNumerical) {
    const onMouseOverCell = function (d) {
      div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
      div
        .html(
          isNumerical
            ? `${type} <br/>${(+d[type]).toFixed(3)}`
            : `${isSNP ? `SNP:${subtype}` : type}<br/>${_.get(
                d,
                isSNP ? `${subtype}.allele` : type
              )}`
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    };
    let subtype = isSNP ? type.split("_")[2] : "";
    data = data.filter((d) => _.keys(d).includes(isSNP ? subtype : type));
    let div = d3.select("#tooltip");
    let cells = d3
      .select(`#${this.props.containerID}`)
      .selectAll(`.cell.md-${type.replace(/ /g, "_")}`)
      .data(data)
      .enter()
      .append("svg:rect")
      .attr("class", ({ Information }) => `cell ${Information} md-${type}`)
      .attr("width", cellSize)
      .attr("height", cellHeight)
      .attr("y", ({ Information }) => yScale(Information))
      .attr("x", () => xScale(type))
      .attr("fill", (d) => colorScale(_.get(d, isSNP ? `${subtype}.allele` : type)));
    if (isSNP) {
      d3.select(`#${this.props.containerID}`)
        .selectAll(`.pattern.md-${type.replace(/ /g, "_")}`)
        .data(data.filter((d) => _.get(d, `${subtype}.notsupport`, false)))
        .enter()
        .append("svg:rect")
        .attr("class", ({ Information }) => `pattern ${Information} md-${type}`)
        .attr("width", cellSize)
        .attr("height", cellHeight)
        .attr("y", ({ Information }) => yScale(Information))
        .attr("x", () => xScale(type))
        .attr("fill", "url(#diagonalHatch)")
        .on("mouseover", onMouseOverCell)
        .on("mouseout", function (d) {
          div.transition().duration(500).style("opacity", 0);
        });
    }
    cells.on("mouseover", onMouseOverCell).on("mouseout", function (d) {
      div.transition().duration(500).style("opacity", 0);
    });
  }

  createBoxplots(data, xScale, yScale, cellHeight, center, data_extent, type, itemSize) {
    let boxplot_x = d3v5.scaleLinear().domain(data_extent).range([0, itemSize]);
    let div = d3.select("#tooltip");

    d3v5
      .select(`#${this.props.containerID}`)
      .selectAll(`.boxplot.md-${type.replace(/ /g, "_")}`)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `boxplot ${Information} md-${type}`)
      .attr(
        "transform",
        ({ Information }) => `translate(${xScale(type)}, ${center + yScale(Information)})`
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
      )
      .on("mouseover", function (d) {
        div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
        div
          .html(`${type} <br/>Mean: ${d.boxes[0].end.toFixed(3)}`)
          .style("left", d3v5.event.pageX + "px")
          .style("top", d3v5.event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        div.transition().duration(500).style("opacity", 0);
      });
  }

  /**
   * Creates the histogram for the collapsed data (categorical or SNPs)
   *
   * @param {Array of clustered information} data
   * @param {General xScale for box x position} xScale
   * @param {General yScale for box y position} yScale
   * @param {Pixel number} cellHeight
   * @param {Elements among data} dataDomain
   * @param {Name of metadata} type
   * @param {Number} itemSize
   * @param {D3 Colorscale} colorScale
   * @param {boolean} isSNP
   */
  createHistogram(data, xScale, yScale, cellHeight, dataDomain, type, itemSize, colorScale, isSNP) {
    const onMouseOverBars = function (d) {
      div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
      div
        .html(`${isSNP ? `SNP:${subtype}` : type} <br/> ${d[0]}: ${d[1]}`)
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    };
    let subtype = isSNP ? type.split("_")[2] : "";
    let div = d3.select("#tooltip");

    let max = d3.max(
      data.reduce((acc, d) => {
        let temp = d[isSNP ? subtype : type];
        return [...acc, ...Object.values(temp ? temp : {})];
      }, [])
    );
    let heatmapCell = d3
      .select(`#${this.props.containerID}`)
      .selectAll(`.histo.md-${type.replace(/ /g, "_")}`)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `histo ${Information} md-${type}`)
      .attr("transform", ({ Information }) => `translate(${xScale(type)}, ${yScale(Information)})`);

    let bars = heatmapCell
      .selectAll(`.bars.md-${type.replace(/ /g, "_")}`)
      .data((d) => Object.entries(_.get(d, isSNP ? subtype : type, {})))
      .enter()
      .append("rect")
      .attr("class", `.bars.md-${type.replace(/ /g, "_")}`)
      .attr("fill", (d) => colorScale(isSNP ? d[0][0] : d[0]));
    let xScaleBar = d3.scale.ordinal().domain(dataDomain).rangeBands([0, itemSize]);

    let yScaleBar = d3.scale
      .linear()
      .domain([isSNP ? -1 * max : 0, max])
      .range([cellHeight, 0]);
    let barWidth = itemSize / dataDomain.length;
    bars
      .attr("x", (d) => xScaleBar(isSNP ? d[0][0] : d[0]))
      .attr("y", (d) =>
        isSNP
          ? Math.min(cellHeight / 2, yScaleBar((d[0][1] === "-" ? -1 : 1) * d[1]))
          : yScaleBar(d[1])
      )
      .attr("width", barWidth)
      .attr("height", (d) =>
        isSNP ? Math.abs(cellHeight / 2 - yScaleBar(d[1])) : cellHeight - yScaleBar(d[1])
      )
      .on("mouseover", onMouseOverBars)
      .on("mouseout", function (d) {
        div.transition().duration(500).style("opacity", 0);
      });

    if (isSNP) {
      let patterns = heatmapCell
        .selectAll(`.pattern.md-${type.replace(/ /g, "_")}`)
        .data((d) =>
          Object.entries(_.get(d, isSNP ? subtype : type, {})).filter(
            (datum) => datum[0][1] === "-"
          )
        )
        .enter()
        .append("svg:rect")
        .attr("class", `pattern md-${type.replace(/ /g, "_")}`)
        .attr("width", barWidth)
        .attr("height", (d) => Math.abs(cellHeight / 2 - yScaleBar(d[1])))
        .attr("y", (d) =>
          Math.min(cellHeight / 2, yScaleBar((isSNP & (d[0][1] === "-") ? -1 : 1) * d[1]))
        )
        .attr("x", (d) => xScaleBar(d[0][0]))
        .attr("fill", "url(#diagonalHatch)")
        .on("mouseover", onMouseOverBars)
        .on("mouseout", function (d) {
          div.transition().duration(500).style("opacity", 0);
        });

      let xAxis = d3.svg
        .axis()
        .scale(xScaleBar)
        .tickFormat((d) => d);

      heatmapCell
        .append("g")
        .attr("class", "x axis-bar")
        .attr("transform", `translate(0,${cellHeight / 2})`)
        .call(xAxis)
        .call((g) => g.selectAll("text").remove())
        .select("path")
        .style({ "stroke-width": 0.1, fill: "none", stroke: "black", width: 0.1 });
    }
  }

  highlight_leaves(selection = []) {
    if (selection.length === 0) {
      $(".cell, .boxplot, .histo, .pattern").css("opacity", 1); // Nothing selected, everythin bold
    } else {
      $(".cell, .boxplot, .histo, .pattern").css("opacity", 0.2);
      selection.forEach((t) => {
        let lookFor = t.collapsed ? t["show-name"] : t.name; // Either clade or leaf
        $(`.${lookFor}`).css("opacity", 1);
      });
    }
  }

  clusterMetadata = (v, k, mdinfo, actualClade) =>
    mdinfo[k].type.toLowerCase() === "numerical"
      ? boxplot.boxplotStats(v)
      : mdinfo[k].type.toLowerCase() === "categorical"
      ? _.countBy(v)
      : actualClade.showname;

  clusterSNPs = (v, k, mdinfo, actualClade) =>
    k === "Information"
      ? actualClade.showname
      : _.countBy(v.map((d) => `${d.allele}${d.notsupport ? "-" : "+"}`));

  initHeatmap(container) {
    let leaf_nodes = (this.props.nodes || []).filter(d3.layout.phylotree.is_leafnode);
    let height = this.state.height;
    let itemSize = this.state.itemSize;
    let x_elements = d3v5
        .set(this.props.visMd.concat(this.props.visSNPs.map((d) => `${this.SNPprefix}${d}`)))
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

    let ticks = container
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) => {
        g.select(".domain").remove();
      })
      .selectAll(".tick");
    ticks
      .selectAll("text")
      .style("font-size", `${Math.min(cellHeight, 12)}px`)
      .attr("dy", ".35em")
      .attr("font-weight", "normal");
    ticks
      .append("line")
      .attr("class", "guides")
      .attr("x1", (d) => -1 * d.length * Math.min(cellHeight, 12))
      .attr("x2", -9000)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke", "grey")
      .style("stroke-dasharray", "10,3")
      .style("stroke-opacity", 0.25);

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

    container
      .append("defs")
      .append("pattern")
      .attr("id", "diagonalHatch")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 4)
      .attr("height", 4)
      .append("path")
      .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    ticks.selectAll("text").attr("class", (d) => d);
  }

  componentDidMount() {
    let margin = { top: 0, right: 20, bottom: 0, left: 100 };

    let width = this.container.offsetWidth - margin.right - margin.left,
      height = this.container.offsetHeight - margin.top - margin.bottom;

    let itemSize = 10;

    // Create tooltip for heatmap
    d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "tooltip")
      .style("display", "none");

    let svg = d3
      .select(`#${this.props.divID}`)
      .append("svg")
      .attr("id", `display_${this.props.divID}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate( ${margin.left}, ${margin.top})`);

    svg.append("g").attr("id", this.props.containerID);

    this.setState({
      height: height,
      itemSize: itemSize,
    });
  }

  render() {
    return <div id={this.props.divID} className='mchild' ref={(el) => (this.container = el)}></div>;
  }
}

export default Heatmap;
