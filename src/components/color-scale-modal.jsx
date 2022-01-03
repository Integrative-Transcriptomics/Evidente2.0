import React, {Component} from "react";
import ModalOwn from "./modal-own";
import {makeStyles} from "@material-ui/core/styles";
import MyColorPicker from "./color-picker";
import {
    IconButton,
    Paper,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@material-ui/core";
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';

class ColorScaleModal extends Component {
    onClickChangeColor = (event) => {
        this.setState({anchorEl: event.target});
    };

    handleClose = () => {
        this.setState({anchorEl: null});
    };
    handleModalClose = (save) => {
        this.props.handleClose(save,this.state.order.map(d => this.props.mdinfo[this.props.chosenMD].extent[d]), this.state.colorDomain)
    }
    setColor = (index, color)=>{
        const colorDomain=this.state.colorDomain.slice();
        colorDomain[index]=color;
        this.setState({colorDomain:colorDomain})
        console.log(index,color);
    }
    handleUp = (index) => {
        const order = this.state.order.slice();
        if (index > 0) {
            let helper = order[index];
            order[index] = order[index - 1]
            order[index - 1] = helper;
        } else {
            let helper = order[order.length - 1];
            order[order.length - 1] = order[index]
            order[index] = helper;
        }
        this.setState({order: order})
    };
    handleDown = (index) => {
        const order = this.state.order.slice();
        if (index < order.length - 2) {
            let helper = order[index];
            order[index] = order[index + 1]
            order[index + 1] = helper;
        } else {
            let helper = order[0];
            order[0] = order[index]
            order[index] = helper;
        }
        this.setState({order: order})
    };
    state = {
        order: this.props.mdinfo[this.props.chosenMD].extent
            .map((d, i) => i),
        colorDomain: this.props.mdinfo[this.props.chosenMD].extent
            .map(d => this.props.mdinfo[this.props.chosenMD].colorScale(d))
    };
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
    header = ["Name", "Color"];

    render() {
        const currentMD = this.props.mdinfo[this.props.chosenMD];
        const isOrdinal = currentMD.type === "ordinal";
        return (
            <ModalOwn
                id={this.props.ID}
                show={this.props.show}
                onClose={(save)=>this.handleModalClose(save)}
                title={`Select new color scale for metadata ${this.props.chosenMD}`}>
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
                </Popover>
                <Paper elevation={4} className={this.classes.paper}>
                    <TableContainer>
                        <Table ref={(el) => (this.cell = el)}>
                            <TableHead>
                                <TableRow>
                                    {isOrdinal ? <TableCell>Reorder</TableCell> : null}
                                    {this.header.map((title) => (
                                        <TableCell key={title}>{title} </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.state.order.map((value, i) => {
                                    return (
                                        <TableRow key={i}>
                                            {isOrdinal ?
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() => this.handleUp(i)}><ArrowUpwardIcon/></IconButton>
                                                    <IconButton onClick={() => this.handleDown(i)}><ArrowDownwardIcon/></IconButton>
                                                </TableCell> : null}
                                            <TableCell component='th' scope='row'>
                                                {currentMD.extent[value]}
                                            </TableCell>
                                            <TableCell align='left'>
                                                <MyColorPicker
                                                    passID={value}
                                                    index={i}
                                                    setColor={(color)=>this.setColor(i,color)}
                                                    fill={this.state.colorDomain[i]}
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
