import React, { Component } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@material-ui/core";

class SNPTable extends Component {
  state = {};
  header = ["Position", "Allele", "Actions"];
  render() {
    return (
      this.props.rows.length > 0 && (
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
                      <Button
                        size='small'
                        variant='outlined'
                        style={{ color: "black" }}
                        onClick={() => {
                          this.props.onSNPaddition(row.pos);
                        }}
                      >
                        Visualize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )
    );
  }
}

export default SNPTable;
