import React, { Component } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import * as d3 from "d3";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AnnouncementIcon from "@material-ui/icons/Announcement";

import {
  Collapse,
  Switch,
  Paper,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@material-ui/core";

import * as _ from "lodash";
const rowNameTooltip = (name, props) => {
  return (
    <Tooltip id={`${name}-filter-row`} {...props}>
      {name}
    </Tooltip>
  );
};

const warningTooltip = (name, props) => {
  return (
    <Tooltip id={`${name}-order-warning`} {...props}>
      The order of this metadata has not been corrected by the user.
    </Tooltip>
  );
};
const AntSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.grey[500],
    "&$checked": {
      color: theme.palette.common.white,
      "& + $track": {
        opacity: 1,
        backgroundColor: "#337AB7",
        borderColor: theme.palette.primary.main,
      },
    },
  },
  track: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.common.white,
  },
  checked: {},
}))(Switch);

class Legend extends Component {
  classes = makeStyles((theme) => ({
    root: {
      height: 180,
    },
    container: {
      display: "flex",
    },
    paper: {
      margin: theme.spacing(1),
    },
  }));

  /**
   * Creates legend for the given metadata, shows the ColorScale and allows to change it.
   */
  giveLegend = ({ name, colorScale, extent, type }) => {
    let svg = d3.select(`#svg-legend-${name.replace(/ /g, "-")}`);
    let cellWidth = document.getElementById("metadata-card").offsetWidth / 4;
    let isSNP = type.toLowerCase() === "snp";
    svg.style("width", cellWidth + "px").style("height", isSNP ? "40px" : "15px");
    svg.selectAll("*").remove();

    svg = svg.append("g").attr("id", `g-legend-${name.replace(/ /g, "-")}`);
    let div = d3.select("#tooltip");

    const addTexts = (element, posX, posY, anchor, attributes, text) => {
      return element
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

        addMouseOver(textLeft, minExtent);
        addMouseOver(textRight, maxExtent);

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
        addMouseOver(text);

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

        if (_.round(_.last(positions)) > cellWidth) {
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
  state = { checked: false };
  header = ["Name", "Color Scale", "Actions"];
  setChecked = () => this.setState({ checked: !this.state.checked });
  metadataToRows = (metadata) =>
    _.toPairs(metadata)
      .filter((d) => d[1].type.toLowerCase() !== "type")
      .map((d) => ({
        name: d[0],
        colorScale: d[1].colorScale,
        extent: d[1].extent,
        type: d[1].type,
      }));

  componentDidUpdate() {
    this.metadataToRows(this.props.availableMDs).forEach((row) => this.giveLegend(row));
  }

  render() {
    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    return (
      <div className={this.classes.root}>
        <FormControlLabel
          control={<AntSwitch checked={this.state.checked} onChange={this.setChecked} />}
          label='Show legend'
        />
        <div className={this.classes.container}>
          <Collapse in={this.state.checked}>
            <Paper elevation={4} className={this.classes.paper} ref={(el) => (this.cell = el)}>
              <TableContainer>
                <Table size='small' aria-label='sticky table'>
                  <TableHead>
                    <TableRow>
                      {this.header.map((title) => (
                        <TableCell key={title}>{title} </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {_.filter(this.metadataToRows(this.props.availableMDs), (v) => {
                      return accountForLegend.includes(v.name);
                    }).map((row) => {
                      let viewLegend =
                        row.extent.length <= 12 ? (
                          <React.Fragment>
                            <TableCell align='left'>
                              <svg id={`svg-legend-${row.name.replace(/ /g, "-")}`} />
                            </TableCell>
                            <TableCell>
                              <Button
                                size='small'
                                variant='outlined'
                                style={{ color: "black" }}
                                onClick={() => {
                                  this.props.onChange(row.name);
                                }}
                              >
                                Change
                              </Button>
                            </TableCell>
                          </React.Fragment>
                        ) : (
                          <TableCell align='center' colSpan={2}>
                            <Button
                              size='small'
                              variant='outlined'
                              style={{ color: "black" }}
                              onClick={() => {
                                this.props.onChange(row.name);
                              }}
                            >
                              Show/Change Scale
                            </Button>
                          </TableCell>
                        );
                      return (
                        <TableRow key={row.name}>
                          <TableCell scope='row' alignItems='center'>
                            <div style={{ display: "flex" }}>
                              <OverlayTrigger
                                placement='left'
                                overlay={rowNameTooltip(row.name, this.props)}
                              >
                                <span
                                  style={{
                                    "max-width": this.cell.offsetWidth / 4,
                                    overflow: "hidden",
                                    "text-overflow": "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "block",
                                    cursor: "default",
                                  }}
                                >
                                  {row.name}
                                </span>
                              </OverlayTrigger>
                              {!this.props.orderChanged && row.type === "ordinal" && (
                                <OverlayTrigger
                                  placement='top'
                                  overlay={warningTooltip(row.name, this.props)}
                                >
                                  <AnnouncementIcon
                                    style={{ display: "inline-block", marginLeft: "5px" }}
                                  />
                                </OverlayTrigger>
                              )}
                            </div>
                          </TableCell>

                          {viewLegend}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Collapse>
        </div>
      </div>
    );
  }
}

export default Legend;
