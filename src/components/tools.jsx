import React, { Component } from "react";
import { Accordion, Card, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import Select, { components } from "react-select";
import * as _ from "lodash";
import * as $ from "jquery";
import * as d3 from "d3";

import { Typography, Divider, Grid } from "@material-ui/core";

import HelpIcon from "@material-ui/icons/Help";

import Legend from "./legend";
import FilterList from "./filter-list";

const helpTooltip = (props) => {
  return (
    <Tooltip id='help-filter-tooltip' {...props}>
      A filter group defines all the characteristics a certain node should contain in order to be
      shown. Within filter groups, the nodes need to belong to at least one group to be shown.
    </Tooltip>
  );
};
const { ValueContainer, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  return (
    <ValueContainer {...props}>
      <Placeholder {...props} isFocused={props.isFocused}>
        {props.selectProps.placeholder}
      </Placeholder>
      {React.Children.map(children, (child) =>
        child && child.type !== Placeholder ? child : null
      )}
    </ValueContainer>
  );
};

const selectStates = {
  container: (provided, state) => ({
    ...provided,
    marginTop: 20,
    height: "auto",
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    overflow: "visible",
    height: "auto",
  }),
  placeholder: (provided, state) => ({
    ...provided,
    position: "absolute",
    top: state.hasValue || state.selectProps.inputValue ? -15 : "50%",
    transition: "top 0.1s, font-size 0.1s",
    fontSize: (state.hasValue || state.selectProps.inputValue) && 13,
  }),
};
class Tools extends Component {
  state = { filterValue: [], selectedFeatures: [] };

  /**
   * Creates the legend within the given container.
   * It is updated everytime the user changes the scale
   *
   * @param {HTMLElement} container
   * @param {Number} cellWidth
   * @param {Object} rowOfData
   */
  addLegend = (container, cellWidth, { name, colorScale, extent, type }, isStatic = false) => {
    // let svg = d3.select(`#svg-legend-${name.replace(/ /g, "-")}`);
    // let cellWidth = document.getElementById("metadata-card").offsetWidth / 4;
    console.log(container);
    let svg = container.append("g").attr("id", `g-legend-${name.replace(/ /g, "-")}`);
    let div = d3.select("#tooltip");

    const addTexts = (element, posX, posY, anchor, attributes, text) => {
      return element
        .append("g")
        .append("text")
        .style("text-anchor", anchor)
        .attr({
          x: posX,
          y: posY,
        })
        .attr(attributes)
        .classed("noselect", true)
        .text(text);
    };

    const addMouseOver = (element, text = undefined) => {
      element
        .on("mouseover", (d) => {
          div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
          div
            .html(text ? text : d)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", function (d) {
          div.transition().duration(500).style("opacity", 0);
        });
    };

    let attrShadow = { stroke: "white", "stroke-width": "5px", opacity: 0.75 };
    let attrsFronttext = { fill: "black" };
    let marginText = 2;
    let yPosition = 15 * 0.75;
    switch (type.toLowerCase()) {
      case "numerical":
        var defs = svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs
          .append("linearGradient")
          .attr("id", `linear-gradient-${name.replace(/ /g, "-")}`);
        //Horizontal gradient
        linearGradient.attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
        //Set the color for the start (0%)
        linearGradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", colorScale(extent[0])); //light blue

        //Set the color for the end (100%)
        linearGradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", colorScale(extent[1])); //dark blue

        let group = svg.append("g");
        group
          .append("rect")
          .attr("width", cellWidth)
          .attr("height", 15)
          .style("fill", `url(#linear-gradient-${name.replace(/ /g, "-")})`);

        let minExtent = parseFloat(extent[0].toFixed(2));
        addTexts(group, marginText, yPosition, "start", attrShadow, minExtent);
        let textLeft = addTexts(group, marginText, yPosition, "start", attrsFronttext, minExtent);

        let maxExtent = parseFloat(extent[1].toFixed(2));
        let posRight = cellWidth - marginText;
        addTexts(group, posRight, yPosition, "end", attrShadow, maxExtent);
        let textRight = addTexts(group, posRight, yPosition, "end", attrsFronttext, maxExtent);

        if (!isStatic) {
          addMouseOver(textLeft, minExtent);
          addMouseOver(textRight, maxExtent);
        }

        break;

      case "snp":
        let cladeSpecificity = ["+", "—"];
        let [posSpecificity, negSpecificity] = cladeSpecificity;

        const createAxis = (extent, maxRange, orient) => {
          let tempScale = d3.scale.ordinal().domain(extent).rangeBands([0, maxRange]);
          let tempAxis = d3.svg
            .axis()
            .scale(tempScale)
            .tickFormat((d) => d)
            .orient(orient);
          return [tempScale, tempAxis];
        };

        let [xScale, xAxis] = createAxis(extent, cellWidth - 10, "top");
        let [yScale, yAxis] = createAxis(cladeSpecificity, 30, "left");

        const renderAxis = (classType, axis, transform = "") => {
          return svg
            .append("g")
            .attr("class", `SNP-legend-${classType}`)
            .attr("transform", transform)
            .call(axis)
            .call((g) => g.select(".domain").remove())
            .selectAll("text")
            .style("font-size", `${Math.min(cellWidth, 10)}px`)
            .style("text-anchor", "start");
        };

        let maxWidth = 0;

        renderAxis("y-axis", yAxis).each(function () {
          maxWidth = Math.max(maxWidth, this.getComputedTextLength());
        });
        renderAxis("x-axis", xAxis, `translate(-5, 5)`);

        let margin = maxWidth + 5;
        let legendCubeWidth = (cellWidth - margin) / extent.length;
        let legendCubeHeight = 30 / 2;

        let groupAllele = svg.selectAll("rect").data(extent).enter();

        const addRectangle = (posY, fill) => {
          groupAllele
            .append("svg:rect")
            .attr("width", legendCubeWidth)
            .attr("height", legendCubeHeight)
            .attr("y", posY)
            .attr("x", (d) => xScale(d))
            .attr("fill", fill);
        };

        addRectangle(yScale(posSpecificity), (d) => colorScale(d)); // adds Positive SNPs
        addRectangle(yScale(negSpecificity), (d) => colorScale(d)); // adds Negative SNPs
        addRectangle(yScale(negSpecificity), "url(#diagonalHatch)"); // adds Pattern over Negative SNPs

        svg.attr("transform", `translate(${margin}, 12)`);
        break;

      default:
        let textWidth = [];
        let cubeWidth = cellWidth / extent.length;
        let groupCategory = svg.selectAll("g").data(extent).enter().append("g");

        let shadow = addTexts(groupCategory, 0, yPosition, "middle", attrShadow, (d) => d).each(
          function () {
            let thisWidth = Math.max(cubeWidth, this.getComputedTextLength() + 10); // Text width + margin

            textWidth.push(thisWidth);
          }
        );

        let text = addTexts(groupCategory, 0, yPosition, "middle", attrsFronttext, (d) => d);
        if (!isStatic) {
          addMouseOver(text);
        }

        const cumulativeSum = ((sum) => (value) => (sum += value))(0);
        let positions = [0, ...textWidth.map(cumulativeSum)];

        shadow.attr({
          x: (d, i) => positions[i] + textWidth[i] * 0.5,
        });
        text.attr({
          x: (d, i) => positions[i] + textWidth[i] * 0.5,
        });

        groupCategory
          .insert("rect", ":first-child")
          .attr({
            width: (d, i) => Math.max(textWidth[i], cubeWidth),
            height: 15,
            x: (d, i) => positions[i],
          })
          .style("fill", (value) => colorScale(value));

        if (_.round(_.last(positions)) > cellWidth && !isStatic) {
          let drag = d3.behavior.drag().on("drag", dragmove);
          function dragmove(d) {
            let actualTransform = d3.transform(d3.select(this).attr("transform")).translate[0];
            let x = _.clamp(d3.event.dx + actualTransform, cellWidth - _.last(positions), 0);
            d3.select(this).attr("transform", `translate( ${x}  , 0)`);
          }
          svg.style("cursor", "grab").call(drag);
        }

        break;
    }
  };

  metadataToRows = (metadata) =>
    _.toPairs(metadata)
      .filter((d) => d[1].type.toLowerCase() !== "type")
      .map((d) => ({
        name: d[0],
        colorScale: d[1].colorScale,
        extent: d[1].extent,
        type: d[1].type,
      }));

  async onExport(type) {
    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    let allData = document.createElement("div");
    let data = document.getElementById("parent-svg");
    allData.appendChild(data.cloneNode(true));

    _.filter(this.metadataToRows(this.props.availableMDs), (v) => {
      return accountForLegend.includes(v.name);
    }).forEach((data) => {
      console.log(data.name);
      let legend = d3
        .select("#root")
        .append("svg")
        .attr({ id: `testing-output-${data.name}`, width: 1000 });
      this.addLegend(legend, 100, data, true);
      allData.appendChild(legend.node());
    });
    console.log(allData.outerHTML);
    let response = await fetch("/api/export", {
      method: "post",
      body: JSON.stringify({ htmlContent: allData.outerHTML, typeOf: type }),
      // body:
      // `data=${allData.outerHTML}&type=${type}`,
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((e) => alert(e));

    let responseBlob = await response.blob();
    const url = window.URL.createObjectURL(responseBlob);
    let link = document.createElement("a");
    link.href = url;
    link.download = `export_evidente.${type}`;
    link.click();
  }

  onChangeFilter = (value) => {
    this.setState({ selectedFeatures: value.map(({ value }) => value), filterValue: value });
  };
  onFileChange = ({ target }, label) => {
    if (target.files[0] !== undefined) {
      let fileName = target.files[0].name;
      $(target)
        .next(".custom-file-label")
        .css({
          "max-width": "100%",
          overflow: "hidden",
          "text-overflow": "ellipsis",
          whiteSpace: "nowrap",
          cursor: "default",
          paddingRight: "30%",
          display: "inline-block",
        })
        .html(`${label}: ${fileName}`);
    }
  };
  /**
   * Creates the labels and values for the correspoinding selecting menu
   * @param {dictionary of metadata} metadata
   */
  getMetadata(metadata) {
    return _.keys(metadata)
      .filter((d) => !["SNP", "Information"].includes(d))
      .map((d) => {
        return { value: d, label: d };
      });
  }
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
        <Accordion id='tools' defaultActiveKey='0'>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='0'
              id='files-card'
              className='noselect header-accordion'
            >
              Load files
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='0'>
              <Card.Body>
                <Form id='fileform' onSubmit={this.props.onFileUpload}>
                  {[
                    { id: "nwk", label: "Newick Tree" },
                    { id: "snp", label: "SNP Table" },
                    { id: "taxainfo", label: "Taxa metadata" },
                    // { id: "SNPinfo", label: "SNP metadata" },
                    // { id: "decoding", label: "Decoding files" },
                  ].map(({ id, label }) => (
                    <Form.Group key={id}>
                      <Form.File
                        id={id}
                        label={label}
                        name={id}
                        custom
                        onChange={(el) => this.onFileChange(el, label)}
                      />
                    </Form.Group>
                  ))}
                  <Button variant='primary' type='submit'>
                    Submit
                  </Button>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='1'
              id='metadata-card'
              className='noselect header-accordion'
            >
              Visualize data
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='1'>
              <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
                <Typography variant='h6'>Select to visualize</Typography>
                <Select
                  id='snpdatashow'
                  options={this.props.availableSNPs.map((d) => ({ value: d, label: d }))}
                  value={this.props.visSNPs.map((d) => ({ value: d, label: d }))}
                  onChange={this.props.onSNPChange}
                  placeholder={"Visualize SNPs"}
                  isMulti
                  components={{
                    ValueContainer: CustomValueContainer,
                  }}
                  menuPortalTarget={document.getElementById("tools")}
                  styles={selectStates}
                ></Select>
                <Select
                  id='metadatashow'
                  options={this.getMetadata(this.props.availableMDs)}
                  value={this.props.visMd.map((d) => ({ value: d, label: d }))}
                  onChange={this.props.onMDChange}
                  isMulti
                  placeholder={"Visualize metadata"}
                  components={{
                    ValueContainer: CustomValueContainer,
                  }}
                  menuPortalTarget={document.getElementById("tools")}
                  styles={selectStates}
                ></Select>
                <Legend
                  metadataToRows={this.metadataToRows}
                  addLegend={this.addLegend}
                  orderChanged={this.props.orderChanged}
                  visSNPs={this.props.visSNPs}
                  visMd={this.props.visMd}
                  availableMDs={this.props.availableMDs}
                  onChange={this.props.onColorChange}
                />
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='2'
              id='filtering-card'
              className='noselect header-accordion'
            >
              Filter nodes
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='2'>
              <Card.Body>
                <Grid container spacing={2} direction='row' alignItems='center'>
                  <Grid item>
                    <Typography variant='h6'>Create a filter group with metadata</Typography>
                  </Grid>
                  <Grid item>
                    <OverlayTrigger placement='top' overlay={helpTooltip}>
                      <HelpIcon style={{ display: "flex" }} />
                    </OverlayTrigger>
                  </Grid>
                </Grid>

                <Form.Group key='metadatafilter'>
                  <Select
                    id='select-filter'
                    options={this.getMetadata(this.props.availableMDs || [])}
                    isMulti
                    value={this.state.filterValue}
                    onChange={this.onChangeFilter}
                    placeholder={"Select metadata for filter group"}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    menuPortalTarget={document.getElementById("tools")}
                    styles={selectStates}
                  ></Select>
                </Form.Group>
                <Button
                  variant='primary'
                  disabled={this.state.selectedFeatures.length === 0}
                  onClick={() => {
                    this.setState({ filterValue: null, selectedFeatures: [] });
                    this.props.onOpenFilter(this.state.selectedFeatures);
                  }}
                >
                  Create filter group
                </Button>
                {this.props.createdFilters.length > 0 && (
                  <React.Fragment>
                    <Divider variant='middle' style={{ marginTop: "5px", marginBottom: "5px" }} />
                    <Typography variant='h6'>Created filter groups</Typography>
                    <Typography variant='h6' style={{ fontWeight: "normal" }}>
                      Applying following filter would result in {this.props.remainingNodes}{" "}
                      {this.props.remainingNodes > 1 || this.props.remainingNodes === 0
                        ? "nodes"
                        : "node"}
                    </Typography>

                    <FilterList
                      remainingNodes={this.props.remainingNodes}
                      availableMDs={this.props.availableMDs}
                      onApplyAllFilters={this.props.onApplyAllFilters}
                      nameOfFilters={this.props.nameOfFilters}
                      createdFilters={this.props.createdFilters}
                      onDeleteFilter={this.props.onDeleteFilter}
                      onDeleteAllFilters={this.props.onDeleteAllFilters}
                    />
                  </React.Fragment>
                )}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='3'
              id='export-card'
              className='noselect header-accordion'
            >
              Export visualization
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='3'>
              <Card.Body>
                <Typography variant='h6' gutterBottom={true}>
                  Export visualizations
                </Typography>
                <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
                  {["PDF", "PNG", "JPEG"].map((typeOfExport) => (
                    <Grid item>
                      <Button
                        variant='primary'
                        onClick={() => this.onExport(typeOfExport.toLowerCase())}
                      >
                        As {typeOfExport}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
