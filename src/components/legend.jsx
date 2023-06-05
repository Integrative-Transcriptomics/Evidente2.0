import React, { Component, createRef } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import {
  Button,
  Collapse, IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import EditIcon from '@material-ui/icons/Edit';

import { filter, isEqual } from "lodash";

const rowNameTooltip = (name) => {
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
    svgCell: {
      width: "50%",
      maxWidth: "50%",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  }));




  constructor(props) {
    super(props);
    this.state = {
      checked: true,
    };
  }
  calculateTextColor = (fill) => {
    const aRgbHex = fill.slice(1).match(/.{1,2}/g);
    if (parseInt(aRgbHex[0], 16) * 0.299 + parseInt(aRgbHex[1], 16) * 0.587 + parseInt(aRgbHex[2], 16) * 0.114 > 186) {
      return ("#000000")
    } else {
      return ("#ffffff")
    }

  }
  renderNumerical = (row, cellWidth, elementHeight, marginText, yPosition) => {
    return <g>
      <defs>
        <linearGradient id={`linear-gradient-${row.name.replace(/ /g, "-")}`} x1="0%" y1="0%" x2="100%" y2="0%" >
          <stop offset="0%" stopColor={row.colorScale(row.extent[0])} />
          <stop offset="100%" stopColor={row.colorScale(row.extent[1])} />
        </linearGradient>
      </defs>
      <g>
        <rect
          width={cellWidth}
          height={elementHeight}
          fill={`url(#linear-gradient-${row.name.replace(/ /g, "-")})`}
        />
        {[[marginText, "start", row.extent[0]], [cellWidth - marginText, "end", row.extent[1]]].map(textType =>
          <text
            className="noselect"
            x={textType[0]}
            y={yPosition}
            textAnchor={textType[1]}
            dominantBaseline="middle"
            fill={this.calculateTextColor(row.colorScale(textType[2]))}
            style={{ "cursor": "default" }}
            onMouseEnter={(d) => {
              let tooltip = document.getElementById("tooltip");
              tooltip.style.cssText = `transition: opacity 0.2s ease-in-out; opacity: 1; left: ${d.pageX}px; top: ${d.pageY}px`;
              tooltip.innerText = `${textType[2]} `;

            }}
            onMouseLeave={() => {
              let tooltip = document.getElementById("tooltip");
              tooltip.style.cssText = `transition: opacity 0.2s ease-in-out; opacity: 0`;
            }}

          >
            {parseFloat(textType[2]).toFixed(2)}
          </text>

        )}
      </g>
    </g >


  }
  /**
   * 
   * @param {Dictionary} row 
   * @param {Float} cellWidth 
   * @param {Int} elementHeight 
   * @param {*} marginText 
   * @param {*} yPosition 
   * @returns 
   */
  renderSNP = (row, cellWidth, elementHeight, yPosition) => {
    let cladeSpecificity = ["mono", "para", "poly"];
    let specificityLabels = ["sup.", "para.", "non-sup."];
    let marginLeft = 40;
    let elementWidth = (cellWidth - marginLeft) / row.extent.length;
    return (
      <React.Fragment>
        <g key="snps-x-axis"> {row.extent.map(a => {
          return <text className="noselect"
            key={`x-axis-${a}`} x={marginLeft + (row.extent.indexOf(a) * elementWidth) + elementWidth * 0.5}
            y={yPosition} textAnchor="middle"
            fill="black" style={{ "cursor": "default", "fontSize": `${Math.min(cellWidth, 10)}px` }} >{a}</text>
        })}
        </g >
        <g key="snps-y-axis"> {specificityLabels.map(c => {
          return <text className="noselect"
            key={`y-axis-${c}`} x={0} y={yPosition + specificityLabels.indexOf(c) * elementHeight + elementHeight * 0.5}
            textAnchor="center" dominantBaseline="middle" fill="black" style={{ "cursor": "default", "fontSize": `${Math.min(cellWidth, 10)}px` }} >{c}</text>
        })
        }
        </g>
        <g key="legend-rectangles-snps"> {cladeSpecificity.map(specificity => {
          return row.extent.map(allele => {

            return specificity === "mono" && allele === "N" ?
              <text
                className="noselect"
                key={`legend-rectangles-snps-${specificity}-${allele}`}
                textAnchor="middle"
                fontSize={Math.min(cellWidth, 10)}
                x={marginLeft + (row.extent.indexOf(allele) * elementWidth) + elementWidth * 0.5}
                y={yPosition + (cladeSpecificity.indexOf(specificity) * elementHeight) + elementHeight * 0.5}
                dominantBaseline="middle"
                fill="black"
                style={{ "cursor": "default" }}
              >
                N/A
              </text>
              :
              <rect
                key={`legend-rectangles-snps-${specificity}-${allele}`}
                x={marginLeft + (row.extent.indexOf(allele) * elementWidth) + 2}
                y={yPosition + (cladeSpecificity.indexOf(specificity) * elementHeight) + 3}
                width={elementWidth - 4}
                height={elementHeight - 6}
                stroke={specificity === "mono" ? "white" : row.colorScale(allele)}
                fill={specificity === "mono" ? row.colorScale(allele) : specificity === "poly" ? "black" : "white"}
              />
          })
        })}
        </g>
      </React.Fragment >)

  }
  renderCategorical = (row, cellWidth, elementHeight, marginText, yPosition) => {
    const startDrag = (event) => {
      event.preventDefault();
      const group = event.target;

      // Store initial positions
      const initialMousePos = { x: event.clientX };
      const initialRectPos = { x: group.getAttribute("x") };

      const drag = (event) => {
        const distanceX = event.clientX - initialMousePos.x;

        // Update the group element position
        group.setAttribute("x", parseInt(initialRectPos.x) + distanceX);
      };

      const stopDrag = () => {
        // Remove event listeners
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);
      };

      // Register event listeners
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
    };

    let textWidth = [];
    let cumulativeWidth = 0;
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    context.font = "10px Arial";
    row.extent.forEach((a) => {
      let thisWidth = context.measureText(a).width + 10;
      textWidth.push(thisWidth);
      cumulativeWidth += thisWidth;
    });

    let scalingFactor = cellWidth / cumulativeWidth;
    if (scalingFactor > 1) {
      textWidth = textWidth.map((a) => a * scalingFactor);
    }
    let startPosition = 0;
    let text = row.extent.map((text, i) => {
      let textElement = (
        <g
          key={`legend-rectangles-allCategories-${text}`}
          style={{ cursor: "grab" }}
          onMouseDown={startDrag}
        >
          <rect
            key={`legend-rectangles-${text}`}
            fill={row.colorScale(text)}
            x={startPosition}
            y={yPosition - 10}
            width={textWidth[i]}
            height={elementHeight}
          />
          <text
            className="noselect"
            key={`legend-text-${text}`}
            x={startPosition + textWidth[i] * 0.5}
            textAnchor="middle"
            fontSize="10px"
            fill={this.calculateTextColor(row.colorScale(text))}
            y={yPosition}
          >
            {text}
          </text>
        </g>
      );
      startPosition += textWidth[i];
      return textElement;
    });
    return text;
  };


  fillSVG = (row, cellWidth) => {
    let marginText = 2;
    let yPosition = 15 * 0.75;
    let elementHeight = 15;
    if (row.type === "numerical") {
      return (this.renderNumerical(row, cellWidth, elementHeight, marginText, yPosition))
    }
    else if (row.type === "SNP") {
      return (this.renderSNP(row, cellWidth, elementHeight, yPosition))
    }
    else {
      return (this.renderCategorical(row, cellWidth, elementHeight, marginText, yPosition))
    }

  }


  /**
   * Rendering of the SVGs for the legends
   * @param {*} row 
   * @param {*} cellWidth 
   * @returns 
   */
  renderTypes = (row) => {
    let isSNP = row.type.toLowerCase() === "snp";
    let cellWidth = document.body.clientWidth * 0.10;

    return (

      row.extent.length <= 12 ?
        <React.Fragment>
          <TableCell align='left'>
            <svg
              id={`svg-legend-${row.name.replace(/ /g, "-")} `}
              style={{ "width": cellWidth, height: isSNP ? "55px" : "15px" }}>

              {this.fillSVG(row, cellWidth)}
            </svg>
          </TableCell>
          <TableCell>
            <IconButton
              size='small'
              variant='outlined'
              style={{ color: "black" }}
              onClick={() => {
                this.props.onChange(row.name);
              }}
            >
              <EditIcon />
            </IconButton>
          </TableCell>
        </React.Fragment >
        :
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


  }

  renderLegendRow = (row) => {
    let cellWidth = document.body.clientWidth * 0.05;
    // console.log(cellWidth)

    return (<React.Fragment key={`react - fragment - ${row.name} `}>
      <TableRow style={{ maxWidth: "100%" }} key={row.name}>
        <TableCell scope='row'
        >
          <div style={{ display: "flex" }}>
            <OverlayTrigger
              placement='left'
              overlay={rowNameTooltip(row.name)}
            >
              <span
                style={{
                  overflow: "hidden", whiteSpace: "nowrap",
                  textOverflow: "ellipsis", maxWidth: cellWidth
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
                  style={{
                    display: "inline-block",
                    marginLeft: "5px",
                  }}
                />
              </OverlayTrigger>
            )}
          </div>
        </TableCell>
        {this.renderTypes(row)}
      </TableRow>


    </React.Fragment >)
  }

  header = ["Name", "Color Scale", ""];

  shouldComponentUpdate(nextProp, nextState) {
    return (nextProp.toolsShowing & (
      !isEqual(this.props.availableMDs, nextProp.availableMDs) ||
      !isEqual(this.props.visMd, nextProp.visMd) ||
      !isEqual(this.props.visSNPs, nextProp.visSNPs) ||
      !isEqual(this.state.checked, nextState.checked)
    )
    );
  }

  someOrdinalPresent(el) {
    return el.type.toLowerCase() === "ordinal";
  }

  render() {
    const containerWidth = createRef();
    const containerCell = createRef();
    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    return (
      <React.Fragment>
        <div style={{ display: "flex", alignItems: "center", maxWidth: "100%" }}>
          <h4>Legend</h4>
          <AntSwitch
            size='small'
            checked={this.state.checked}
            onChange={() => this.setState({ checked: !this.state.checked })}
          />
        </div>
        <div style={{ padding: "0px 10px" }}>
          <div className={this.classes.container}>
            <Collapse in={this.state.checked}>
              <Paper elevation={4} className={this.classes.paper} >
                <TableContainer style={{ maxWidth: "100%" }}>
                  <Table size='small' aria-label='sticky table' style={{ maxWidth: "100%" }}>
                    <TableHead>
                      <TableRow>
                        {this.header.map((title) => (
                          <TableCell key={title}>{title} </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <React.Fragment>

                        {
                          // This part creates the rows of the legend for each data type visualized 

                          filter(this.props.availableMDs, (v) => {
                            return accountForLegend.includes(v.name);
                          }).map((row) => this.renderLegendRow(row))

                        }


                      </React.Fragment>
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
