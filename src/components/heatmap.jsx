import React, { Component } from "react";
import * as d3 from "d3";
import * as d3v5 from "d3v5";
import * as boxplot from "d3-boxplot";
import * as $ from "jquery";
import * as _ from "lodash";
import GuideLines from "./guide-lines";

class Heatmap extends Component {
    isSNP = this.props.isSNP;
    state = { actualWidth: this.props.maxWidth, expectedWidth: this.props.maxWidth, verticalGuideX: null };
    SNPcolorScale = this.props.SNPcolorScale;
    SNPprefix = "Pos";
    minCollapsedCellWidth = 40;
    minNormalCellWidth = 5;
    maxCellWidth = 30;

    shouldComponentUpdate(nextProp, nextState) {
        let actualProp = this.props;
        let actualHiddenNodes = actualProp.hiddenNodes;
        let newHiddenNodes = nextProp.hiddenNodes;
        let actualCollapsedClades = actualProp.collapsedClades;
        let newCollapsedClades = nextProp.collapsedClades;
        let actualSelectedNodes = actualProp.selectedNodes;
        let newSelectedNodes = nextProp.selectedNodes;
        let actualNodes = actualProp.y_elements || [];
        let newNodes = nextProp.y_elements || [];
        let newVisualized = nextProp.x_elements || [];
        let actualVisualized = actualProp.x_elements || [];
        if (!_.isEqual(actualSelectedNodes, newSelectedNodes)) {
            this.highlight_leaves(newSelectedNodes);
            return false;
        } else return !_.isEqual(newVisualized, actualVisualized) ||
            !_.isEqual(actualNodes, newNodes) ||
            !_.isEqual(actualHiddenNodes, newHiddenNodes) ||
            !_.isEqual(actualCollapsedClades, newCollapsedClades) ||
            !_.isEqual(this.props.mdinfo, nextProp.mdinfo) ||
            this.state.expectedWidth !== nextState.expectedWidth ||
            this.state.actualWidth !== nextState.actualWidth ||
            this.props.maxWidth !== nextProp.maxWidth ||
            this.state.verticalGuideX !== nextState.verticalGuideX;
    }

    updateComponent(init) {
        let props = this.props;
        this.SNPcolorScale = this.props.SNPcolorScale;
        const cellMargin = 1;
        let cellWidthMax = props.collapsedClades.length > 0 ? this.minCollapsedCellWidth : this.maxCellWidth;
        const calcCellWidth = props.maxWidth / props.x_elements.length;
        const cellWidthMin = props.collapsedClades.length > 0
            ? Math.max(this.minCollapsedCellWidth, calcCellWidth)
            : Math.max(this.minNormalCellWidth, calcCellWidth);
        const cellWidth = props.x_elements.length * cellWidthMax < props.maxWidth ? cellWidthMax : cellWidthMin

        let container = d3.select(`#${this.props.containerID}`);
        let expectedVizWidth = cellWidth * props.x_elements.length;
        expectedVizWidth = expectedVizWidth + props.margin.right;
        let actualWidth = expectedVizWidth;


        if (this.props.maxWidth < expectedVizWidth) {
            actualWidth = this.props.maxWidth;
        }
        if (this.state.actualWidth !== actualWidth) {
            this.setState({ actualWidth: actualWidth })
        }
        if (this.state.expectedWidth !== expectedVizWidth) {
            this.setState({ expectedWidth: expectedVizWidth })
        }

        if (init) {
            this.initHeatmap(container);
        }
        if (props.y_elements.length !== this.props.nodes.length) {

            let xScale = d3.scale
                .ordinal()
                .domain(props.x_elements)
                .rangeBands([0, props.x_elements.length * cellWidth]);

            let xAxis = d3.svg
                .axis()
                .scale(xScale)
                .tickFormat((d) => d)
                .orient("top");

            let yScale = d3.scale.ordinal().domain(props.y_elements).rangeBands([0, this.props.height]);

            let yAxis = d3.svg
                .axis()
                .scale(yScale)
                .tickFormat((d) => d)
                .orient("left");

            let cellHeight = (this.props.height / props.y_elements.length - 1) - 2 * cellMargin;
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
                .attr("transform", () => "rotate(-25)")
                .call((g) => {
                    if (cellWidth < 15) {
                        g.remove();
                    }
                });

            container
                .select(`g${this.isSNP ? ".SNP" : ".Metadata"}.y.axis`)
                .selectAll(".tick");

            container.selectAll(`.cell, .boxplot, .histo, .pattern, .guides, .division-line`).remove(); //remove before new creation

            if (props.x_elements.length > 0) {
                props.x_elements.forEach((x_elem) => {
                    let typeOfMD = _.get(props.mdinfo, `${x_elem}.type`, "").toLowerCase();
                    let singleData = props.data.filter((d) => !_.get(d, "clade", false));
                    let actualColorScale = _.get(props.mdinfo, `${x_elem}.colorScale`, this.SNPcolorScale);
                    let scales = { xScale: xScale, yScale: yScale, colorScale: actualColorScale };
                    let cellDimensions = { cellHeight: cellHeight, cellWidth: cellWidth, cellMargin: cellMargin };
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
                    let onlyClusteredData = props.data.filter(({ clade }) => clade);
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

        }
        this.highlight_leaves(this.props.selectedNodes);
    }

    componentDidUpdate(prevProp, prevState) {
        if (prevState.expectedWidth === this.state.expectedWidth
            && prevState.actualWidth === this.state.actualWidth
            && prevState.verticalGuideX === this.state.verticalGuideX) {
            this.updateComponent(prevProp.nodes !== this.props.nodes)
        }
    }


    /**
     * Updates the cells of the heatmap
     * @param {Object} data
     * @param {Object} scales
     * @param {Object} cellDimensions
     * @param {String} type
     * @param {Boolean} isSNP
     * @param {Boolean} isNumerical
     */
    updateCells(
        data,
        { xScale, yScale, colorScale },
        { cellHeight, cellWidth, cellMargin },
        type,
        isSNP,
        isNumerical
    ) {
        const that = this;
        const onMouseOverCell = function (d) {
            that.setState({ verticalGuideX: xScale(type) + xScale.rangeBand() / 2 })

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
            .attr("width", cellWidth - 2 * cellMargin)
            .attr("height", cellHeight)
            .attr("y", ({ Information }) => yScale(Information) + cellMargin)
            .attr("x", () => xScale(type) + cellMargin)
            .attr("fill", (d) => colorScale(_.get(d, isSNP ? `${subtype}.allele` : type)));

        const borderWidth = (0.25 * (cellWidth - 2 * cellMargin) < 0.25 * cellHeight ? 0.25 * (cellWidth - 2 * cellMargin) : 0.25 * cellHeight) + cellMargin;
        const innerCellWidth = cellWidth - borderWidth * 2;
        const innerCellHeight = (cellHeight + 2 * cellMargin) - borderWidth * 2;
        if (isSNP) {
            d3.select(`#${this.props.containerID}`)
                .selectAll(`.pattern.md-${this.transformNameToClass(type)}`)
                .data(data.filter((d) => _.get(d, `${subtype}.notsupport`, false)))
                .enter()
                .append("svg:rect")
                .attr("width", innerCellWidth)
                .attr("height", innerCellHeight)
                .attr("y", ({ Information }) => yScale(Information) + borderWidth)
                .attr("x", () => xScale(type) + borderWidth)
                .attr("fill", "white")
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
    createBoxplots(data, { xScale, yScale }, { cellHeight, cellWidth, cellMargin }, center, data_extent, type) {

        const borderWidth = (0.05 * cellWidth < 0.05 * cellHeight ? 0.05 * cellWidth : 0.05 * cellHeight) + cellMargin;
        const innerCellHeight = cellHeight - borderWidth * 2;
        const innerCellWidth = cellWidth - borderWidth * 2
        let boxplot_x = d3v5.scaleLinear().domain(data_extent).range([0, innerCellWidth]);
        let div = d3.select("#tooltip");

        const boxPlotCells =
            d3v5
                .select(`#${this.props.containerID}`)
                .selectAll(`.boxplot.md-${this.transformNameToClass(type)}`)
                .data(data)
                .enter()
                .append("g")
                .attr("class", ({ Information }) => `boxplot node-${Information} md-${type}`)
                .attr(
                    "transform",
                    ({ Information }) => `translate(${xScale(type)}, ${yScale(Information)})`
                )
        boxPlotCells
            .append("g")
            .attr(
                "transform",
                ({ Information }) => `translate(${cellMargin}, ${center})`
            )
            .datum((d) => ({ ...d[type], nodeName: d["Information"] }))
            .call(
                boxplot
                    .boxplot()
                    .bandwidth(innerCellHeight / 2)
                    .boxwidth(innerCellHeight / 2)
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
        const lineGroup = boxPlotCells
            .append("g")
        lineGroup
            .append("line")
            .attr("x1", cellMargin + 1)
            .attr("x2", cellWidth - (cellMargin + 1))
            .attr("y1", innerCellHeight)
            .attr("y2", innerCellHeight)
            .attr("stroke", "black")
        lineGroup
            .append("line")
            .attr("x1", cellMargin + 1)
            .attr("x2", cellMargin + 1)
            .attr("y1", innerCellHeight)
            .attr("y2", innerCellHeight + 2)
            .attr("stroke", "black")
        lineGroup
            .append("line")
            .attr("x1", cellWidth - (cellMargin + 1))
            .attr("x2", cellWidth - (cellMargin + 1))
            .attr("y1", innerCellHeight)
            .attr("y2", innerCellHeight + 2)
            .attr("stroke", "black")
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
        { cellHeight, cellWidth, cellMargin },
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

        let max = _.get(_.first(data), "clade_size", 0) // setting the max as the size
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

        const borderWidth = (0.05 * cellWidth < 0.05 * cellHeight ? 0.05 * cellWidth : 0.05 * cellHeight) + cellMargin;
        const innerCellHeight = cellHeight - borderWidth * 2;
        const innerCellWidth = cellWidth - borderWidth * 2
        let xScaleBar = d3.scale.ordinal().domain(dataDomain).rangeBands([borderWidth, cellWidth -borderWidth]);
        let yScaleBar = d3.scale.linear().domain([0, max]).range([cellHeight-borderWidth, borderWidth]);

        let barWidth = innerCellWidth / dataDomain.length - cellMargin;
        bars
            .attr("x", (d) => xScaleBar(isSNP ? d[0][0] : d[0]))
            .attr("y", (d) => yScaleBar(d[1]))
            .attr("width", barWidth)
            .attr("height", (d) => innerCellHeight - yScaleBar(d[1]))
            .on("mouseover", onMouseOverBars)
            .on("mouseout", function () {
                div.transition().duration(500).style("opacity", 0);
            });

        if (isSNP) {
            const borderWidth = 0.25 * barWidth < 0.25 * innerCellHeight ? 0.25 * barWidth : 0.25 * innerCellHeight;
            const innerWidth = barWidth - borderWidth * 2;
            const innerHeight = innerCellHeight - borderWidth;
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
                .attr("width", innerWidth)
                .attr("height", (d) => innerHeight - yScaleBar(d[1]))
                .attr("y", (d) => yScaleBar(d[1]) + borderWidth)
                .attr("x", (d) => xScaleBar(d[0][0]) + borderWidth)
                .attr("fill", "white")
                .on("mouseover", onMouseOverBars)
                .on("mouseout", function () {
                    div.transition().duration(500).style("opacity", 0);
                });
        }
        heatmapCell
            .append("line")
            .attr("x1", cellMargin+1)
            .attr("x2", cellWidth - cellMargin-1)
            .attr("y1", innerCellHeight)
            .attr("y2", innerCellHeight)
            .attr("stroke", "black")
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
     * Initiates the heatmap within the given container
     *
     * @param {HTMLElement} container
     */
    initHeatmap(container) {
        // get current state to align heatmap to tree and labels
        let transform = d3v5.select("#zoom-phylotree").attr("transform") || "translate(0,0)scale(1,1)"
        transform = d3.transform(transform)
        container.attr("transform", `translate(0,${transform.translate[1]}), scale(1,${transform.scale[1]}) `)
        container.append("g").attr("class", `${this.isSNP ? "SNP" : "Metadata"} y axis`);
        container.append("g").attr("class", "x axis");
    }

    componentDidMount() {
        this.updateComponent(true)
        this.container.addEventListener("mousemove", this.horizontalDrag)
        this.container.addEventListener('wheel', this.horizontalZoom)
        d3.select(`#${this.props.containerID}`).attr("horizontal-scale", 1)
        d3.select(`#${this.props.containerID}`).attr("x-koordinate", 0)
    }

    horizontalZoom = (ev) => {
        if (ev.ctrlKey) {
            ev.preventDefault()
            let selection = d3.select(`#${this.props.containerID}`)
            let transform = selection.attr("transform") || "translate(0,0)scale(1,1)"
            transform = d3.transform(transform)
            let scale = transform.scale[0]
            scale = scale + ev.deltaY * -0.001;
            scale = Math.min(Math.max(0.5, scale), 10);
            let scaleDifference = Math.min(0, this.state.actualWidth - (this.state.expectedWidth * transform.scale[0]))
            let translateX = Math.max(transform.translate[0], scaleDifference);

            let transformString = `translate(${translateX},${transform.translate[1]})scale(${scale},${transform.scale[1]})`;
            selection.attr(
                "transform",
                `${transformString}`
            );
            selection.attr("horizontal-scale", scale)
            selection.attr("x-koordinate", translateX)
        }
    }

    horizontalDrag = (ev) => {
        if (this.props.dragActive) {
            ev.preventDefault()
            let selection = d3.select(`#${this.props.containerID}`)
            let transform = selection.attr("transform") || "translate(0,0)scale(1,1)"
            transform = d3.transform(transform)
            let translateX = transform.translate[0] + ev.movementX
            let scaleDifference = Math.min(0, this.state.actualWidth - (this.state.expectedWidth * transform.scale[0]))
            translateX = Math.max(Math.min(10, translateX), scaleDifference);
            let transformString = `translate(${translateX},${transform.translate[1]})scale(${transform.scale[0]},${transform.scale[1]})`;
            selection.attr(
                "transform",
                `${transformString}`
            );
            selection.attr("x-koordinate", translateX)
        }
    }

    render() {
        return <div id={this.props.divID} ref={(el) => (this.container = el)}
            style={{ width: this.state.actualWidth, overflow: "hidden" }}
            onMouseLeave={() => this.setState({ verticalGuideX: null })}>
            <svg id={`display_${this.props.divID}`}
                width={this.state.expectedWidth}
                height={this.props.height + this.props.margin.top + this.props.margin.bottom}
            >
                <g transform={`translate( ${this.props.margin.left}, ${this.props.margin.top})`}>
                    <g id={this.props.containerID}>
                        {this.state.verticalGuideX ?
                            <line x1={this.state.verticalGuideX} x2={this.state.verticalGuideX}
                                y1={0} y2={this.props.height} stroke={"gray"}
                                strokeDasharray={"10,3"} strokeOpacity={0.25} />
                            : null}
                    </g>

                </g>
                {this.props.appendLines ?
                    <g transform={`translate( ${this.state.actualWidth - this.props.margin.right}, ${this.props.margin.top})`}>
                        <GuideLines yScale={this.props.yScale} width={this.props.margin.right}
                            height={this.props.height} setIsCustomWidth={this.props.setIsCustomWidth} />
                    </g>
                    : null}
            </svg>
        </div>;
    }
}

export default Heatmap;
