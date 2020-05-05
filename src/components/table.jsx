import React, { Component } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import * as $ from "jquery";

class SNPTable extends Component {
  state = {};
  header = ["Position", "Allele", "Actions"];
  render() {
    return (
      <Paper>
        <TableContainer>
          <Table size='small' stickyHeader aria-label='sticky table'>
            <TableHead>
              <TableRow>
                {
                  <TableCell align='center' colSpan={3}>
                    {this.props.title}
                  </TableCell>
                }
              </TableRow>
              <TableRow>
                {this.header.map((title) => (
                  <TableCell key={title}>{title} </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {this.props.rows.map((row) => (
                <TableRow key={row.pos}>
                  <TableCell component='th' scope='row'>
                    {row.pos}
                  </TableCell>
                  <TableCell align='left'>{row.allele}</TableCell>
                  <TableCell>
                    <a
                      href='#'
                      style={{ color: "black" }}
                      onClick={() => {
                        this.props.onSNPaddition(row.pos);
                      }}
                    >
                      Visualize
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
}

export default SNPTable;
