import React, {Component} from "react";
import clsx from "clsx";
import {withStyles} from "@material-ui/core/styles";
import {AutoSizer, Column, Table} from "react-virtualized";
import {Button, Paper, TableCell, Typography} from "@material-ui/core";
import {isEqual, uniq} from "lodash";

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
    buttonSNP: {color: "black", whiteSpace: "nowrap"},
    tableRowHover: {
        "&:hover": {
            backgroundColor: theme.palette.grey[200],
        },
    },
    tableCell: {
        flex: 1,
        padding: 0,
        justifyContent: "center",
    },
    noClick: {
        cursor: "initial",
    },
});

/**
 * Virtualized tables that speeds up the process of rendering long tables.
 */
class MuiVirtualizedTable extends React.PureComponent {
    getRowClassName = ({index}) => {
        const {classes, onRowClick} = this.props;

        return clsx(classes.tableRow, classes.flexContainer, {
            [classes.tableRowHover]: index !== -1 && onRowClick != null,
        });
    };

    cellRenderer = ({cellData, columnIndex}) => {
        const {columns, classes, rowHeight, onRowClick} = this.props;
        return (
            <TableCell
                component='div'
                className={clsx(classes.tableCell, classes.flexContainer, {
                    [classes.noClick]: onRowClick == null,
                })}
                variant='body'
                style={{height: rowHeight}}
            >
                {columns[columnIndex].label === "Actions" ? (
                    <Button
                        size='small'
                        variant='outlined'
                        className={clsx(classes.buttonSNP)}
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

    headerRenderer = ({label, columnIndex}) => {
        const {headerHeight, columns, classes, data} = this.props;
        let SNPs = uniq(data.map((row) => row.pos));

        return (
            <TableCell
                component='div'
                className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
                variant='head'
                style={{height: headerHeight}}
            >
                {columns[columnIndex].label === "Actions" ? (
                    <Button
                        size='small'
                        variant='outlined'
                        className={clsx(classes.buttonSNP)}
                        onClick={() => {
                            this.props.onMultipleSNPaddition(SNPs);
                        }}
                    >
                        Show all {SNPs.length} SNPs
                    </Button>
                ) : (
                    <span>{label}</span>
                )}
            </TableCell>
        );
    };

    render() {
        const {classes, columns, rowHeight, headerHeight, paperWidth, ...tableProps} = this.props;
        return (
            <AutoSizer>
                {({height, width}) => {
                    return (
                        <Table
                            height={height}
                            width={width}
                            // width={Math.min(270, width)}
                            rowHeight={rowHeight}
                            headerHeight={headerHeight}
                            className={classes.table}
                            {...tableProps}
                            rowClassName={this.getRowClassName}
                        >
                            {columns.map(({dataKey, label}, index) => {
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

/**
 * Application of virtualized table to the SNP table
 */
class ReactVirtualizedTable extends Component {
    constructor(props) {
        super(props);
        this.paperTable = React.createRef();
    }

    state = {};
    minPaperHeight = 60;
    maxPaperHeight = 250;
    rowHeight = 30;
    columnInformation = [
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
    ];
    rowGetter = ({index}) => this.props.rows[index];

    shouldComponentUpdate(nextProp) {
        return !isEqual(this.props.rows, nextProp.rows);
    }

    render() {
        let expectedHeight = (this.props.rows.length + 1) * this.rowHeight; // number of SNP rows + header
        let maxHeight = Math.max(this.minPaperHeight, Math.min(expectedHeight, this.maxPaperHeight));
        if (this.props.rows.length > 0) {
            return (
                <Paper
                    ref={this.paperTable}
                    style={{
                        height: maxHeight + 25,
                        width: "100%",
                        margin: 5,
                    }}
                >
                    <Typography variant='h6' align='center' gutterBottom={true}>
                        SNPs within the actual {this.props.type}
                    </Typography>
                    <div style={{height: maxHeight}}>
                        <VirtualizedTable
                            paperWidth={this.paperTable.offsetWidth}
                            rowCount={this.props.rows.length}
                            rowGetter={this.rowGetter}
                            headerHeight={this.rowHeight}
                            rowHeight={this.rowHeight}
                            columns={this.columnInformation}
                            onSNPaddition={this.props.onSNPaddition}
                            onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                            data={this.props.rows}
                        />
                    </div>
                </Paper>
            );
        } else {
            return (
                <Typography align='center' gutterBottom={true} variant='h6' style={{margin: 5}}>
                    No SNPs within the actual {this.props.type}
                </Typography>
            );
        }
    }
}

export default ReactVirtualizedTable;
