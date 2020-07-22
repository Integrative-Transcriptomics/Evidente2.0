import React, { Component } from "react";
import clsx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import { AutoSizer, Column, Table } from "react-virtualized";
import { TableCell, Paper, Button, Typography } from "@material-ui/core";
import { uniq, isEqual } from "lodash";
const styles = (theme) => ({
  flexContainer: {
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },
  table: {
    "pointer-events": "auto !important",
  },

  tableRow: {
    cursor: "pointer",
  },
  tableRowHover: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200],
    },
  },
  tableCell: {
    flex: 1,
    padding: 0,
  },
  noClick: {
    cursor: "initial",
  },
});

class MuiVirtualizedTable extends React.PureComponent {
  static defaultProps = {
    headerHeight: 30,
    rowHeight: 30,
  };

  getRowClassName = ({ index }) => {
    const { classes, onRowClick } = this.props;

    return clsx(classes.tableRow, classes.flexContainer, {
      [classes.tableRowHover]: index !== -1 && onRowClick != null,
    });
  };

  cellRenderer = ({ cellData, columnIndex }) => {
    const { columns, classes, rowHeight, onRowClick } = this.props;
    return (
      <TableCell
        component='div'
        className={clsx(classes.tableCell, classes.flexContainer, {
          [classes.noClick]: onRowClick == null,
        })}
        variant='body'
        style={{ height: rowHeight, justifyContent: "center" }}
        align={"center"}
      >
        {columns[columnIndex].label === "Actions" ? (
          <Button
            size='small'
            variant='outlined'
            style={{ color: "black" }}
            onClick={() => {
              this.props.onSNPaddition(cellData);
            }}
          >
            Visualize
          </Button>
        ) : (
          <span>{cellData}</span>
        )}
      </TableCell>
    );
  };

  headerRenderer = ({ label, columnIndex }) => {
    const { headerHeight, columns, classes, data } = this.props;

    return (
      <TableCell
        component='div'
        className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
        variant='head'
        style={{ height: headerHeight, justifyContent: "center" }}
        align={columns[columnIndex].numeric || false ? "right" : "left"}
      >
        {columns[columnIndex].label === "Actions" ? (
          <Button
            size='small'
            variant='outlined'
            style={{ color: "black" }}
            onClick={() => {
              let SNPs = uniq(data.map((row) => row.pos));
              this.props.onMultipleSNPaddition(SNPs);
            }}
          >
            Show all
          </Button>
        ) : (
          <span>{label}</span>
        )}
      </TableCell>
    );
  };

  render() {
    const { classes, columns, rowHeight, headerHeight, ...tableProps } = this.props;
    return (
      <AutoSizer>
        {({ height, width }) => {
          return (
            <Table
              height={height}
              width={width}
              rowHeight={rowHeight}
              headerHeight={headerHeight}
              className={classes.table}
              {...tableProps}
              rowClassName={this.getRowClassName}
            >
              {columns.map(({ dataKey, label }, index) => {
                return (
                  <Column
                    key={dataKey}
                    headerRenderer={(headerProps) =>
                      this.headerRenderer({
                        ...headerProps,
                        columnIndex: index,
                      })
                    }
                    width={width}
                    className={classes.flexContainer}
                    cellRenderer={this.cellRenderer}
                    dataKey={dataKey}
                    label={label}
                  />
                );
              })}
            </Table>
          );
        }}
      </AutoSizer>
    );
  }
}

const VirtualizedTable = withStyles(styles)(MuiVirtualizedTable);

class ReactVirtualizedTable extends Component {
  state = {};
  rowGetter = ({ index }) => this.props.rows[index];
  shouldComponentUpdate(nextProp, nextState) {
    return !isEqual(this.props.rows, nextProp.rows);
  }
  render() {
    let maxHeight = Math.max(80, Math.min(this.props.rows.length * 30 + 30, 250));
    if (this.props.rows.length > 0) {
      let SNPs = uniq(this.props.rows.map((row) => row.pos));
      return (
        <Paper
          style={{
            height: maxHeight,
            width: "100%",
            margin: 5,
          }}
        >
          <Typography variant='h6' align='center' gutterBottom={true}>
            SNPs within the actual {this.props.type}
          </Typography>
          <div style={{ height: maxHeight - 25 }}>
            <VirtualizedTable
              rowCount={this.props.rows.length}
              rowGetter={this.rowGetter}
              columns={[
                {
                  label: "Position",
                  dataKey: "pos",
                },
                {
                  label: "Allele",
                  dataKey: "allele",
                },
                {
                  label: "Actions",
                  dataKey: "pos",
                },
              ]}
              onSNPaddition={this.props.onSNPaddition}
              onMultipleSNPaddition={this.props.onMultipleSNPaddition}
              data={this.props.rows}
            />
          </div>
        </Paper>
      );
    } else {
      return (
        <Typography align='center' gutterBottom={true} variant='h6' style={{ margin: 5 }}>
          No SNPs within the actual {this.props.type}
        </Typography>
      );
    }
  }
}

export default ReactVirtualizedTable;
