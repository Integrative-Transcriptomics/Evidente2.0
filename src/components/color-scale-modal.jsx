import React, { Component } from "react";
import ModalOwn from "./modal-own";
import { makeStyles } from "@material-ui/core/styles";
import { get } from "lodash";
import MyColorPicker from "./color-picker";
import {
  Popover,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
class ColorScaleModal extends Component {
  onClickChangeColor = (event) => {
    this.setState({ anchorEl: event.target });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };
  state = {};
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
  header = ["Name", "Color Value"];

  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={this.props.handleClose}
        title={`Select new color scale for metadata ${this.props.chosenMD}`}
      >
        <Popover
          id={"popover"}
          open={Boolean(this.state.anchorEl)}
          anchorEl={this.state.anchorEl}
          onClose={(save) => this.handleClose(save)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        >
          <MyColorPicker element={this.state.anchorEl || null} />
        </Popover>
        <Paper elevation={4} className={this.classes.paper}>
          <TableContainer>
            <Table ref={(el) => (this.cell = el)}>
              <TableHead>
                <TableRow>
                  {this.header.map((title) => (
                    <TableCell key={title}>{title} </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {get(this.props.mdinfo, `${this.props.chosenMD}.extent`, []).map((value, i) => {
                  return (
                    <TableRow key={value}>
                      <TableCell component='th' scope='row'>
                        {value}
                      </TableCell>
                      <TableCell align='left'>
                        <MyColorPicker
                          passID={i}
                          fill={get(this.props.mdinfo, `${this.props.chosenMD}.colorScale`)(value)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </ModalOwn>
    );
  }
}

export default ColorScaleModal;
