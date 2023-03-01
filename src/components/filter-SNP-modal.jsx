import React, {Component} from "react";
import ModalOwn from "./modal-own";
import {Button} from "react-bootstrap";

import {Slider, Typography} from "@material-ui/core";

class FilterSNPsModal extends Component {
    state={value:0}

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
                    Select a threshold to collapse all nodes that have a lower percentage of supporting SNP than the threshold.
                </p>
                <Typography id={`range-slider`}>{"Percentage:"}</Typography>
                <Slider
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
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

export default FilterSNPsModal;
