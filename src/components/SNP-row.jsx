import React, { Component } from "react";
import { TableCell, TableRow, Button } from "@material-ui/core";
class SNPRow extends Component {
  render() {
    return (
      <TableRow key={`${this.props.row.pos}-${this.props.row.allele}`}>
        <TableCell component='th' scope='row'>
          {this.props.row.pos}
        </TableCell>
        <TableCell align='left'>{this.props.row.allele}</TableCell>
        <TableCell>
          <Button
            size='small'
            variant='outlined'
            style={{ color: "black" }}
            onClick={() => {
              this.props.onSNPaddition(this.props.row.pos);
            }}
          >
            Visualize
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

export default SNPRow;
