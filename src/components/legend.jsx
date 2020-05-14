import React, { Component } from "react";
import { makeStyles } from "@material-ui/core/styles";
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
    console.log(type, extent);
    let svg = d3.select(`#svg-legend-${name.replace(/ /g, "-")}`);
    let cellWidth = this.cell.offsetWidth / 3;
    svg.style("width", cellWidth + "px").style("height", "15px");
    svg.selectAll("*").remove();
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
          .text(extent[0].toFixed(2));
        group
          .append("text")
          .style("text-anchor", "start")
          .attr({
            x: 2,
            y: 15 * 0.75,
          })
          .attr("fill", "black")
          .text(extent[0].toFixed(2));
        group
          .append("text")
          .style("text-anchor", "end")
          .attr({
            x: cellWidth - 2,
            y: 15 * 0.75,
          })
          .attr("stroke", "white")
          .attr("stroke-width", "5px")
          .attr("opacity", 0.75)
          .text(extent[1].toFixed(2));
        group
          .append("text")
          .style("text-anchor", "end")
          .attr({
            x: cellWidth - 2,
            y: 15 * 0.75,
          })
          .attr("fill", "black")
          .text(extent[1].toFixed(2));
        break;
      case "snp":
      case "categorical":
      case "ordinal":
        let cubeWidth = cellWidth / extent.length;
        let i = 0;
        for (let value of extent) {
          let group = svg.append("g");
          group
            .append("rect")
            .attr({
              width: cubeWidth,
              height: 15,
              x: i * cubeWidth,
            })
            .style("fill", colorScale(value));

          group
            .append("text")
            .style("text-anchor", "middle")
            .attr({
              x: i * cubeWidth + cubeWidth * 0.5,
              y: 15 * 0.75,
            })
            .attr("stroke", "white")
            .attr("stroke-width", "5px")
            .attr("opacity", 0.75)
            .text(value);
          group
            .append("text")
            .style("text-anchor", "middle")
            .attr({
              x: i * cubeWidth + cubeWidth * 0.5,
              y: 15 * 0.75,
            })
            .attr("fill", "black")
            .text(value);
          i = i + 1;
        }

        break;
      default:
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
    this.metadataToRows(this.props.availableMDs).map((row) => this.giveLegend(row));
  }

  render() {
    return (
      <div className={this.classes.root}>
        <FormControlLabel
          control={<Switch checked={this.state.checked} onChange={this.setChecked} />}
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
                              Change Scale
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
