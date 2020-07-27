import React, { Component } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import * as d3 from "d3";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import {
  Collapse,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@material-ui/core";

import { filter, isEqual } from "lodash";
const rowNameTooltip = (name, props) => {
  return <Tooltip id={`${name}-filter-row`}>{name}</Tooltip>;
};

const warningTooltip = (name, { onChange }) => {
  return (
    <Tooltip id={`${name}-order-warning`}>
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
  root: {
    marginLeft: "15px",
    marginRight: "25px",
    marginTop: "3px",
    verticalAlign: "middle",
  },
  track: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 8,
    opacity: 1,
    backgroundColor: theme.palette.common.white,
  },
  checked: {},
}))(Switch);

class Legend extends Component {
  classes = makeStyles((theme) => ({
    container: {
      display: "flex",
      margin: "15px",
    },
    paper: {
      margin: theme.spacing(4),
    },
  }));

  state = { checked: true };
  header = ["Name", "Color Scale", "Actions"];
  setChecked = () => this.setState({ checked: !this.state.checked });

  shouldComponentUpdate(nextProp) {
    return (
      !isEqual(this.props.availableMDs, nextProp.availableMDs) ||
      !isEqual(this.props.visMd, nextProp.visMd) ||
      !isEqual(this.props.visSNPs, nextProp.visSNPs)
    );
  }
  someOrdinalPresent(el) {
    return el.type.toLowerCase() === "ordinal";
  }

  componentDidUpdate() {
    let cellWidth = document.getElementById("metadata-card").offsetWidth / 4;

    this.props.availableMDs.forEach((row) => {
      let isSNP = row.type.toLowerCase() === "snp";

      let container = d3.select(`#svg-legend-${row.name.replace(/ /g, "-")}`);
      container.style("width", cellWidth + "px").style("height", isSNP ? "40px" : "15px");
      container.selectAll("*").remove();
      this.props.addLegend(container, cellWidth, row);
    });
  }

  render() {
    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    return (
      <React.Fragment>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h4>Legend</h4>
          <AntSwitch size='small' checked={this.state.checked} onChange={this.setChecked} />
        </div>
        <div style={{ padding: "0px 10px" }}>
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
                      {filter(this.props.availableMDs, (v) => {
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
                            <TableCell scope='row' style={{ alignItems: "center" }}>
                              <div style={{ display: "flex" }}>
                                <OverlayTrigger
                                  placement='left'
                                  overlay={rowNameTooltip(row.name, this.props)}
                                >
                                  <span
                                    style={{
                                      maxWidth: this.cell.offsetWidth / 4,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
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

                      {this.props.availableMDs.some(this.someOrdinalPresent) && (
                        <TableRow>
                          <TableCell align='center' colSpan={3}>
                            <Button
                              size='small'
                              variant='outlined'
                              style={{ color: "black" }}
                              onClick={this.props.onChangeOrder}
                            >
                              Change order of Ordinal values
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Collapse>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Legend;
