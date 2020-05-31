import React, { Component } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { withStyles } from "@material-ui/core/styles";
import * as d3 from "d3";

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
  giveLegend = ({ name, colorScale, extent, type }) => {
    let svg = d3.select(`#svg-legend-${name.replace(/ /g, "-")}`);
    let cellWidth = this.cell.offsetWidth / 3;
    svg.style("width", cellWidth + "px").style("height", "15px");
    svg.selectAll("*").remove();
    svg = svg.append("g").attr("id", `g-legend-${name.replace(/ /g, "-")}`);
    let div = d3.select("#tooltip");
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
        group
          .append("text")
          .style("text-anchor", "start")
          .attr({
            x: 2,
            y: 15 * 0.75,
          })
          .attr("stroke", "white")
          .attr("stroke-width", "5px")
          .attr("opacity", 0.75)
          .classed("noselect", true)

          .text(extent[0].toFixed(2));
        group
          .append("text")
          .style("text-anchor", "start")
          .attr({
            x: 2,
            y: 15 * 0.75,
          })
          .attr("fill", "black")
          .classed("noselect", true)

          .text(extent[0].toFixed(2))
          .on("mouseover", () => {
            div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
            div
              .html(`${extent[0].toFixed(2)}`)
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY - 28 + "px");
          })
          .on("mouseout", function (d) {
            div.transition().duration(500).style("opacity", 0);
          });
        group
          .append("text")
          .style("text-anchor", "end")
          .attr({
            x: cellWidth - 2,
            y: 15 * 0.75,
          })
          .attr("stroke", "white")
          .classed("noselect", true)

          .attr("stroke-width", "5px")
          .attr("opacity", 0.75)
          .text(extent[1].toFixed(2));
        group
          .append("text")
          .style("text-anchor", "end")
          .classed("noselect", true)

          .attr({
            x: cellWidth - 2,
            y: 15 * 0.75,
          })
          .attr("fill", "black")
          .text(extent[1].toFixed(2))
          .on("mouseover", () => {
            div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
            div
              .html(`${extent[1].toFixed(2)}`)
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY - 28 + "px");
          })
          .on("mouseout", function (d) {
            div.transition().duration(500).style("opacity", 0);
          });
        break;
      case "snp":
      case "categorical":
      case "ordinal":
        let textWidth = [];
        let cubeWidth = cellWidth / extent.length;
        let groupCategory = svg.selectAll("g").data(extent).enter().append("g");
        let textShadow = groupCategory
          .append("text")
          .style("text-anchor", "middle")
          .attr("stroke", "white")
          .attr("stroke-width", "5px")
          .attr("opacity", 0.75)
          .text((value) => value)
          .classed("noselect", true)

          .each(function () {
            let thisWidth = Math.max(cubeWidth, this.getComputedTextLength() + 10); // Text width + margin
            textWidth.push(thisWidth);
          });

        let text = groupCategory
          .append("text")
          .style("text-anchor", "middle")
          .attr("fill", "black")
          .text((value) => value)
          .classed("noselect", true)
          .on("mouseover", (value) => {
            div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
            div
              .html(`${value}`)
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY - 28 + "px");
          })
          .on("mouseout", function (d) {
            div.transition().duration(500).style("opacity", 0);
          });

        const cumulativeSum = ((sum) => (value) => (sum += value))(0);
        let positions = textWidth.map(cumulativeSum);
        positions = [0, ...positions];
        textShadow.attr({
          x: (d, i) => positions[i] + textWidth[i] * 0.5,
          y: 15 * 0.75,
        });
        text.attr({
          x: (d, i) => positions[i] + textWidth[i] * 0.5,
          y: 15 * 0.75,
        });
        let rect = groupCategory
          .insert("rect", ":first-child")
          .attr({
            width: (d, i) => Math.max(textWidth[i], cubeWidth),
            height: 15,
            x: (d, i) => positions[i],
          })
          .style("fill", (value) => colorScale(value));
        if (_.last(positions) > cellWidth) {
          let drag = d3.behavior.drag().on("drag", dragmove);

          function dragmove(d) {
            var x = Math.min(0, Math.max(cellWidth - _.last(positions), d3.event.x));
            d3.select(this).attr("transform", `translate( ${x}  , 0)`);
          }
          svg.style("cursor", "grab").call(drag);
        }

        break;
      default:
        break;
    }
    // let drag = d3.behavior.drag().on("drag", dragmove);

    // function dragmove(d) {
    //   var x = d3.event.x;
    //   d3.select(this).attr("transform", `translate( ${Math.max(x)}  , 0)`);
    // }
    // svg.style("cursor", "grab").call(drag);
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
    this.metadataToRows(this.props.availableMDs).map((row) => this.giveLegend(row));
  }

  render() {
    return (
      <div className={this.classes.root}>
        <FormControlLabel
          control={<AntSwitch checked={this.state.checked} onChange={this.setChecked} />}
          label='Show legend'
        />
        <div className={this.classes.container}>
          <Collapse in={this.state.checked}>
            <Paper elevation={4} className={this.classes.paper}>
              <TableContainer>
                <Table size='small' aria-label='sticky table' ref={(el) => (this.cell = el)}>
                  <TableHead>
                    <TableRow>
                      {this.header.map((title) => (
                        <TableCell key={title}>{title} </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.metadataToRows(this.props.availableMDs).map((row) => {
                      return (
                        <TableRow key={row.name}>
                          <TableCell component='th' scope='row'>
                            {row.name}
                          </TableCell>
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
