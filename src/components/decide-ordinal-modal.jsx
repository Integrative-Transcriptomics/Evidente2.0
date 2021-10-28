import React, {Component} from "react";
import ModalOwn from "./modal-own";
import {Typography} from "@material-ui/core";

class DecideOrdinalModal extends Component {
    render() {
        return (
            <ModalOwn
                id={this.props.ID}
                show={this.props.show}
                onClose={(save) => {
                    this.props.handleClose(save);
                }}
                buttonName={"Yes"}
                secondButtonName={"No"}
                title={`Sort Ordinal values?`}>
                <Typography variant='body1'>
                    Some ordinal values were detected within your metadata input. These are sorted
                    alphabetically by default. Would you like to sort them yourself?
                </Typography>
            </ModalOwn>
        );
    }
}

export default DecideOrdinalModal;
