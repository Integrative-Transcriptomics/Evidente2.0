import React, {Component} from "react";
import ModalOwn from "./modal-own";
import {Button} from "react-bootstrap";

import {Slider, Typography} from "@material-ui/core";

class CollapseModal extends Component {
    state={value:0, maxSlider: this.props.tree_depth}

    onChange = (ev, newValue) => {
        this.setState({value:newValue})
    };

    render() {
        return (
            <ModalOwn
                id={this.props.ID}
                show={this.props.show}
                onClose={(save) => {this.props.handleClose(save);
                }}
                title="Collapse Nodes by Depth"
            >
                <p style={{ textAlign: "justify" }}>
                    The depth of a node is the number of edges present in path from the root node to that node.
                </p>
                <Typography id={`range-slider`}>{"Depth:"}</Typography>
                <Slider
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    min={0}
                    max={this.props.tree_depth}
                    value={this.state.value}
                    aria-labelledby = 'range-slider'
                    onChange={(ev, newValue) => this.onChange(ev, newValue)}
                /> 
                <Button
                    id={"selectNodes"}
                    variant='secondary'
                    onClick={() => { 
                        this.props.handleChanges(this.state.value)                       
                    }}
                >
                    {"Select Nodes"}
                </Button>
                
            </ModalOwn>
        );
    }
}

export default CollapseModal;
