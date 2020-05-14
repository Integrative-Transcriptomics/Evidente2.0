import React, { Component } from "react";
import ModalOwn from "./ModalOwn";

class ColorScaleModal extends Component {
  state = {};
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={() => this.props.handleClose()}
        title='Select new color scale for metadata'
      ></ModalOwn>
    );
  }
}

export default ColorScaleModal;
