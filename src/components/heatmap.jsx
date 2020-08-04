import React, { Component } from "react";
import * as d3 from "d3";
import * as d3v5 from "d3v5";
import * as boxplot from "d3-boxplot";
import * as $ from "jquery";
import * as _ from "lodash";

class Heatmap extends Component {
  isSNP = this.props.isSNP;
  state = {};
  SNPcolorScale = this.props.SNPcolorScale;
  heightGlobal = 0;
  widthGlobal = 0;
  SNPprefix = "Pos";
  minCollapsedCellWidth = 40;
  minNormalCellWidth = 5;
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
    if (!_.isEqual(actualSelectedNodes, newSelectedNodes)) {
      this.highlight_leaves(newSelectedNodes);
      return false;
    } else if (
      !_.isEqual(newVisualized, actualVisualized) ||
      !_.isEqual(actualVisualizedSNPs, newVisualizedSNPs) ||
      !_.isEqual(actualNodes, newNodes) ||
      !_.isEqual(actualHiddenNodes, newHiddenNodes) ||
      !_.isEqual(actualCollapsedClades, newCollapsedClades) ||
      (!_.isEqual(actualState.mdinfo, nextProp.mdinfo) && newNodes.length > 0)
    ) {
      return true;
    } else {
      return false;
    }
  }
  componentDidUpdate(prevProp, prevState) {
    // console.log("Updating");
    // Object.entries(this.props).forEach(
    //   ([key, val]) => prevProp[key] !== val && console.log(`Prop '${key}' changed`)
    // );
    // if (this.state) {
    //   Object.entries(this.state).forEach(
    //     ([key, val]) => prevState[key] !== val && console.log(`State '${key}' changed`)
    //   );
    // }
    let props = this.props;
    this.SNPcolorScale = this.props.SNPcolorScale;
    let shownNodes = props.tree
      .get_nodes()
      .filter((node) => this.isVisibleEndNode(node))
      .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));

    let x_elements = this.isSNP
        ? this.props.visSNPs.map((d) => `${this.SNPprefix}${d}`)
        : this.props.visMd,
      y_elements = shownNodes;

    let cellWidthMin =
      props.collapsedClades.length > 0
        ? this.minCollapsedCellWidth
        : Math.min(this.minNormalCellWidth, this.widthGlobal / shownNodes.length);
    let cellWidthMax = this.widthGlobal * (props.collapsedClades.length > 0 ? 0.25 : 0.1);
    let cellWidth = Math.max(
      Math.min(this.widthGlobal / x_elements.length, cellWidthMax),
      cellWidthMin
    );

    let container = d3.select(`#${this.props.containerID}`);
    let expectedVizWidth = cellWidth * x_elements.length;

    const modLR = d3.behavior.drag().on("drag", () => {
      let t = d3.transform(container.attr("transform"));
      let intendedDrag = t.translate[0] + d3.event.dx;
      let diffWidths = expectedVizWidth === 0 ? 0 : this.widthGlobal - expectedVizWidth;
      container.attr(
        "transform",
        `translate( ${Math.max(
          Math.min(intendedDrag, t.scale[0] * Math.max(diffWidths, 0)),
          t.scale[0] *
            Math.min(diffWidths, -(t.scale[0] * this.widthGlobal) / 2 + this.widthGlobal / 2)
        )}, ${t.translate[1]})scale(${t.scale})`
      );
    });

    d3.select(`#display_${this.props.divID}`).call(this.props.onZoom).call(modLR);

    if (props.nodes && !prevProp.nodes) {
      this.initHeatmap(container);
    } else if (shownNodes.length !== this.props.nodes.length) {
      let processedData = this.isSNP
        ? this.preprocessSNPs(
            props.snpdata.support,
            props.snpdata.notsupport,
            props.visSNPs,
            props.ids.labToNum
          )
        : props.taxadata;

      // Cluster the data
      if (props.collapsedClades.length !== 0 || false) {
        processedData = this.clusterData(
          processedData,
          props.collapsedClades,
          this.isSNP ? this.clusterSNPs : this.clusterMetadata,
          props.mdinfo
        );
      }
      let cellSize = cellWidth - 0.5;

      let finalData = processedData.filter(({ Information }) => shownNodes.includes(Information));

      let xScale = d3.scale
        .ordinal()
        .domain(x_elements)
        .rangeBands([0, x_elements.length * cellWidth]);

      let xAxis = d3.svg
        .axis()
        .scale(xScale)
        .tickFormat((d) => d)
        .orient("top");

      let yScale = d3.scale.ordinal().domain(y_elements).rangeBands([0, this.heightGlobal]);

      let yAxis = d3.svg
        .axis()
        .scale(yScale)
        .tickFormat((d) => d)
        .orient("left");

      let cellHeight = this.heightGlobal / y_elements.length - 1;

      container
        .selectAll(`g${this.isSNP ? ".SNP" : ".Metadata"}.y.axis`)
        .call(yAxis)
        .selectAll("text, .domain")
        .remove();

      let renderedXAxis = container.selectAll("g.x.axis").call(xAxis);
      renderedXAxis.selectAll(".domain").remove();

      renderedXAxis
        .selectAll("text")
        .style("font-size", `${Math.min(cellWidth, 12)}px`)
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".5em")
        .attr("transform", (d) => "rotate(-25)")
        .call((g) => {
          if (cellWidth < 15) {
            g.remove();
          }
        });

      let ticks = container
        .select(`g${this.isSNP ? ".SNP" : ".Metadata"}.y.axis`)
        .selectAll(".tick");

      container.selectAll(`.cell, .boxplot, .histo, .pattern, .guides, .division-line`).remove(); //remove before new creation

      if (x_elements.length > 0) {
        this.appendGuideLines(ticks, -5, -this.widthGlobal);

        x_elements.forEach((x_elem) => {
          let typeOfMD = _.get(props.mdinfo, `${x_elem}.type`, "").toLowerCase();
          let singleData = finalData.filter((d) => !_.get(d, "clade", false));
          let actualColorScale = _.get(props.mdinfo, `${x_elem}.colorScale`, this.SNPcolorScale);
          let scales = { xScale: xScale, yScale: yScale, colorScale: actualColorScale };
          let cellDimensions = { cellHeight: cellHeight, cellWidth: cellSize };
          this.updateCells(
            singleData,
            scales,
            cellDimensions,
            x_elem,
            this.isSNP,
            typeOfMD === "numerical"
          );
          let dataDomain = this.isSNP
            ? this.props.snpPerColumn[x_elem.split(this.SNPprefix)[1]] // Take only those SNPs present in the column
            : _.get(props.mdinfo, `${x_elem}.extent`); // Take corresponding extent of metadata
          let onlyClusteredData = finalData.filter(({ clade }) => clade);
          if (typeOfMD === "numerical") {
            let coordForCenter = cellHeight / 4;
            this.createBoxplots(
              onlyClusteredData,
              scales,
              cellDimensions,
              coordForCenter,
              dataDomain,
              x_elem
            );
          } else {
            this.createHistogram(
              onlyClusteredData,
              scales,
              cellDimensions,
              dataDomain,
              x_elem,
              this.isSNP
            );
          }
        });
      }

      if (this.isSNP && this.props.visMd.length !== 0) {
        this.appendGuideLines(
          ticks,
          5 + x_elements.length * cellWidth,
          Math.max(expectedVizWidth, this.widthGlobal) * 1.1
        );
      }
    }
    this.highlight_leaves(this.props.selectedNodes);
  }
  /**
   * Helper function for appending the guidelines
   * @param {HTMLElement} ticks
   * @param {Number} start
   * @param {Number} end
   */
  appendGuideLines(ticks, start, end) {
    ticks
      .append("line")
      .attr("class", (d) => `guides  node-${d}`)
      .attr("x1", start)
      .attr("x2", end)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke", "grey")
      .style("stroke-dasharray", "10,3")
      .style("stroke-opacity", 0.25);
  }

  /**
   * Test if the given node is visible
   *
   * @param {Object} node
   */
  isVisibleEndNode = (node) => {
    return (
      (this.props.tree.is_leafnode(node) || node["own-collapse"]) &&
      d3.layout.phylotree.is_node_visible(node)
    );
  };
  /**
   * Helper function for the extraction of the SNPs from the nodes
   * @param {Object} SNPdata contains the SNP distribution to the nodes
   * @param {Object} labelToID contains the dictionary that distributes the labels
   * @param {Boolean} notSupport Boolean to know which category is meant
   */
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

  /**
   *
   * Helper function to aggregate the inforamtion of a clade
   *
   * @param {*} data
   * @param {*} actualClades
   * @param {*} clusterMethod
   * @param {*} mdinfo
   */
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

      let jointMetadataInformation = _.mergeWith({}, ...metadataToAggregate, (a = [], b) =>
        a.concat(b)
      );
      let aggregatedData = _.mapValues(jointMetadataInformation, (v, k) =>
        clusterMethod(v, k, mdinfo, actualClade)
      );
      aggregatedData["clade"] = true;

      allAggregatedData = [...allAggregatedData, aggregatedData];
    });

    return [...allAggregatedData, ...data];
  }

  /**
   * Updates the cells of the heatmap
   * @param {Object} data
   * @param {Object} scales
   * @param {Object} cellDimensions
   * @param {String} type
   * @param {Boolean} isSNP
   * @param {*Boolean} isNumerical
   */
  updateCells(
    data,
    { xScale, yScale, colorScale },
    { cellHeight, cellWidth },
    type,
    isSNP,
    isNumerical
  ) {
    const onMouseOverCell = function (d) {
      d3.selectAll(`.node-${d.Information}.guides`).classed("highlighted-guide", true);
      div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
      div
        .html(
          isNumerical
            ? `${type} <br/>${parseFloat((+d[type]).toFixed(3))}`
            : `${isSNP ? `SNP:${subtype}` : type}<br/>${_.get(
                d,
                isSNP ? `${subtype}.allele` : type
              )}`
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    };

    let subtype = isSNP ? type.split(this.SNPprefix)[1] : "";
    data = data.filter((d) => _.keys(d).includes(isSNP ? subtype : type));
    let div = d3.select("#tooltip");
    let cells = d3
      .select(`#${this.props.containerID}`)
      .selectAll(`.cell.md-${this.transformNameToClass(type)}`)
      .data(data)
      .enter()
      .append("svg:rect")
      .attr("class", ({ Information }) => `cell node-${Information} md-${type}`)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("y", ({ Information }) => yScale(Information))
      .attr("x", () => xScale(type))
      .attr("fill", (d) => colorScale(_.get(d, isSNP ? `${subtype}.allele` : type)));

    if (isSNP) {
      d3.select(`#${this.props.containerID}`)
        .selectAll(`.pattern.md-${this.transformNameToClass(type)}`)
        .data(data.filter((d) => _.get(d, `${subtype}.notsupport`, false)))
        .enter()
        .append("svg:rect")
        .attr("class", ({ Information }) => `pattern node-${Information} md-${type}`)
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("y", ({ Information }) => yScale(Information))
        .attr("x", () => xScale(type))
        .attr("fill", "url(#diagonalHatch)")
        .on("mouseover", onMouseOverCell)
        .on("mouseout", function (d) {
          d3.selectAll(`.node-${d.Information}.guides`).classed("highlighted-guide", false);
          div.transition().duration(500).style("opacity", 0);
        });
    }
    cells.on("mouseover", onMouseOverCell).on("mouseout", function ({ Information }) {
      d3.selectAll(`.node-${Information}.guides`).classed("highlighted-guide", false);

      div.transition().duration(500).style("opacity", 0);
    });
  }

  /**
   *
   * @param {Array} data
   * @param {Object} param1
   * @param {Object} param2
   * @param {number} center
   * @param {Array} data_extent
   * @param {String} type
   */
  createBoxplots(data, { xScale, yScale }, { cellHeight, cellWidth }, center, data_extent, type) {
    let boxplot_x = d3v5.scaleLinear().domain(data_extent).range([0, cellWidth]);
    let div = d3.select("#tooltip");

    d3v5
      .select(`#${this.props.containerID}`)
      .selectAll(`.boxplot.md-${this.transformNameToClass(type)}`)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `boxplot node-${Information} md-${type}`)
      .attr(
        "transform",
        ({ Information }) => `translate(${xScale(type)}, ${center + yScale(Information)})`
      )
      .datum((d) => ({ ...d[type], nodeName: d["Information"] }))
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
        d3.selectAll(`.node-${d.nodeName}.guides`).classed("highlighted-guide", true);

        div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
        div
          .html(`${type} <br/>Median: ${parseFloat(d.boxes[0].end.toFixed(3))}`)
          .style("left", d3v5.event.pageX + "px")
          .style("top", d3v5.event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        d3.selectAll(`.node-${d.nodeName}.guides`).classed("highlighted-guide", false);

        div.transition().duration(500).style("opacity", 0);
      });
  }

  /**
   * Creates the histogram for the collapsed data (categorical or SNPs)
   *
   * @param {Array} data
   * @param {Object} scales
   * @param {Object} cellDimensions
   * @param {Array} dataDomain
   * @param {String} type
   * @param {Boolean} isSNP
   */
  createHistogram(
    data,
    { xScale, yScale, colorScale },
    { cellHeight, cellWidth },
    dataDomain,
    type,
    isSNP
  ) {
    const onMouseOverBars = function (d) {
      div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
      div
        .html(`${isSNP ? `SNP:${subtype}` : type} <br/> ${d[0]}: ${d[1]}`)
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    };
    let subtype = isSNP ? type.split(this.SNPprefix)[1] : "";
    let div = d3.select("#tooltip");

    let max = d3.max(
      data.reduce((acc, d) => {
        let temp = d[isSNP ? subtype : type];
        return [...acc, ...Object.values(temp ? temp : {})];
      }, [])
    );
    let heatmapCell = d3
      .select(`#${this.props.containerID}`)
      .selectAll(`.histo.md-${this.transformNameToClass(type)}`)
      .data(data)
      .enter()
      .append("g")
      .attr("class", ({ Information }) => `histo node-${Information} md-${type}`)
      .attr("transform", ({ Information }) => `translate(${xScale(type)}, ${yScale(Information)})`);
    heatmapCell
      .on("mouseover", ({ Information }) => {
        d3.selectAll(`.node-${Information}.guides`).classed("highlighted-guide", true);
      })
      .on("mouseout", ({ Information }) => {
        d3.selectAll(`.node-${Information}.guides`).classed("highlighted-guide", false);
      });
    let bars = heatmapCell
      .selectAll(`.bars.md-${this.transformNameToClass(type)}`)
      .data((d) => Object.entries(_.get(d, isSNP ? subtype : type, {})))
      .enter()
      .append("rect")
      .attr("class", `.bars.md-${this.transformNameToClass(type)}`)
      .attr("fill", (d) => colorScale(isSNP ? d[0][0] : d[0]));

    let xScaleBar = d3.scale.ordinal().domain(dataDomain).rangeBands([0, cellWidth]);
    let yScaleBar = d3.scale.linear().domain([0, max]).range([cellHeight, 0]);

    let barWidth = cellWidth / dataDomain.length;
    bars
      .attr("x", (d) => xScaleBar(isSNP ? d[0][0] : d[0]))
      .attr("y", (d) => yScaleBar(d[1]))
      .attr("width", barWidth)
      .attr("height", (d) => cellHeight - yScaleBar(d[1]))
      .on("mouseover", onMouseOverBars)
      .on("mouseout", function (d) {
        div.transition().duration(500).style("opacity", 0);
      });

    if (isSNP) {
      heatmapCell
        .selectAll(`.pattern-bars.md-${this.transformNameToClass(type)}`)
        .data((d) =>
          Object.entries(_.get(d, isSNP ? subtype : type, {})).filter(
            (datum) => datum[0][1] === "-"
          )
        )
        .enter()
        .append("svg:rect")
        .attr("class", `pattern-bars md-${this.transformNameToClass(type)}`)
        .attr("width", barWidth)
        .attr("height", (d) => cellHeight - yScaleBar(d[1]))
        .attr("y", (d) => yScaleBar(d[1]))
        .attr("x", (d) => xScaleBar(d[0][0]))
        .attr("fill", "url(#diagonalHatch)")
        .on("mouseover", onMouseOverBars)
        .on("mouseout", function (d) {
          div.transition().duration(500).style("opacity", 0);
        });

      // let xAxis = d3.svg
      //   .axis()
      //   .scale(xScaleBar)
      //   .tickFormat((d) => d);

      // heatmapCell
      //   .append("g")
      //   .attr("class", "x axis-bar")
      //   .call(xAxis)
      //   .call((g) => g.selectAll("text").remove())
      //   .select("path")
      //   .style({ "stroke-width": 0.1, fill: "none", stroke: "black", width: 0.1 });
    }
  }

  /**
   * Removes unallowed strings from the classname
   * @param {String} name of the class to be changed
   */
  transformNameToClass(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
  }
  /**
   * Highlights the corresponding elements for the selected nodes.
   *
   * @param {Object} selection Object containing the nodes selected
   */
  highlight_leaves(selection = []) {
    if (selection.length === 0) {
      $(".cell, .boxplot, .histo, .pattern").css("opacity", 1); // Nothing selected, everythin bold
      d3.selectAll(`.guides`).classed("fixed-guide", false);
    } else {
      $(".cell, .boxplot, .histo, .pattern").css("opacity", 0.2);
      d3.selectAll(`.guides`).classed("fixed-guide", false);

      selection.forEach((t) => {
        let lookFor = t.collapsed ? t["show-name"] : t.name; // Either clade or leaf
        $(`.node-${lookFor}`).css("opacity", 1);
        d3.selectAll(`.guides.node-${lookFor}`).classed("fixed-guide", true);
      });
    }
  }
  /**
   *
   * @param {Object} supportSNPs Contains the SNPs label as supporting
   * @param {Object} nonSupportSNPs Similar, but for non-supporting SNPs
   * @param {Array} visualizedSNPs List of the SNPs to visualize
   * @param {Object} IDs Contains the id to label dictinoary
   */
  preprocessSNPs(supportSNPs, nonSupportSNPs, visualizedSNPs, IDs) {
    // Include only those that are visualized
    let reducedSupportSNPs = supportSNPs.filter(({ pos }) => visualizedSNPs.includes(pos));
    let reducedNotSupportSNPs = nonSupportSNPs.filter(({ pos }) => visualizedSNPs.includes(pos));
    // Get the correct labelling
    let modifiedSNPData = this.modifySNPs(reducedSupportSNPs, IDs);
    modifiedSNPData = modifiedSNPData.concat(this.modifySNPs(reducedNotSupportSNPs, IDs, true));
    // Unify to one entry per ndoe
    let mergedSNPs = modifiedSNPData.reduce((acc, cur) => {
      let obj = acc.find((d) => d.Information === cur.Information) || {};
      let filteredOutput = acc.filter((d) => d.Information !== cur.Information);
      return [...filteredOutput, { ...obj, ...cur }];
    }, []);
    return mergedSNPs;
  }
  /**
   *
   * @param {*} v Value -- Data for the group to aggregate
   * @param {*} k Key -- The metadata the group belongs to
   * @param {*} mdinfo Object containing all metadata info
   * @param {*} actualClade Object for the actual clade
   */
  clusterMetadata = (v, k, mdinfo, actualClade) =>
    mdinfo[k].type.toLowerCase() === "numerical"
      ? boxplot.boxplotStats(v)
      : ["categorical", "ordinal"].includes(mdinfo[k].type.toLowerCase())
      ? _.countBy(v)
      : actualClade.showname;

  /**
   *
   * @param {*} v Value -- Data for the group to aggregate
   * @param {*} k Key -- The metadata the group belongs to
   * @param {*} actualClade Object for the actual clade
   */
  clusterSNPs = (v, k, mdinfo, actualClade) =>
    k === "Information"
      ? actualClade.showname
      : _.countBy(v.map((d) => `${d.allele}${d.notsupport ? "-" : "+"}`));
  /**
   * Initiates the heatmap within the given container
   *
   * @param {HTMLElement} container
   */
  initHeatmap(container) {
    container.append("g").attr("class", `${this.isSNP ? "SNP" : "Metadata"} y axis`);
    container.append("g").attr("class", "x axis");
    container
      .append("defs")
      .append("pattern")
      .attr("id", "diagonalHatch")
      .attr({
        width: "8",
        height: "8",
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(60)",
      })
      .append("rect")
      .attr({ width: "4", height: "8", transform: "translate(0,0)", fill: "white" });
  }

  componentDidMount() {
    let margin = this.props.margin;
    margin.top = 0.05 * this.container.offsetHeight;
    let width = this.container.offsetWidth - margin.right - margin.left,
      height = this.container.offsetHeight - margin.top - margin.bottom;

    let svg = d3
      .select(`#${this.props.divID}`)
      .append("svg")
      .attr("id", `display_${this.props.divID}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate( ${margin.left}, ${margin.top})`);

    svg.append("g").attr("id", this.props.containerID);

    this.heightGlobal = height;
    this.widthGlobal = width;
  }

  render() {
    return <div id={this.props.divID} className='mchild' ref={(el) => (this.container = el)}></div>;
  }
}

export default Heatmap;
