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
  Typography,
} from "@material-ui/core";
import SNPRow from "./SNP-row";
import { isEqual, uniq } from "lodash";

class SNPTable extends Component {
  state = {};
  header = ["Position", "Allele", "Actions"];
  shouldComponentUpdate(nextProp, nextState) {
    return !isEqual(nextProp.rows, this.props.rows);
  }
  render() {
    if (this.props.rows.length > 0) {
      let SNPs = uniq(this.props.rows.map((row) => row.pos));
      return (
        <Paper>
          <TableContainer>
            <Table
              style={{ maxHeight: "250px" }}
              size='small'
              stickyHeader
              aria-label='sticky table'
            >
              <TableHead>
                <TableRow>
                  <TableCell align='center' colSpan={2}>
                    SNPs within the actual {this.props.type}
                  </TableCell>
                  <TableCell>
                    <Button
                      size='small'
                      variant='outlined'
                      style={{ color: "black" }}
                      onClick={() => {
                        this.props.onMultipleSNPaddition(SNPs);
                      }}
                    >
                      Show all {SNPs.length} SNPs
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {this.header.map((title) => (
                    <TableCell key={title}>{title} </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {this.props.rows.map((row) => (
                  <SNPRow
                    key={`${row.pos}-${row.allele}`}
                    row={row}
                    onSNPaddition={this.props.onSNPaddition}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      );
    } else {
      return (
        <Typography align='center' gutterBottom={true}>
          No SNPs within the actual {this.props.type}
        </Typography>
      );
    }
  }
}

export default SNPTable;
