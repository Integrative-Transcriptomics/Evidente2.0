import React, { Component } from "react";
import ModalOwn from "./ModalOwn";
import * as _ from "lodash";

import { TextField } from "@material-ui/core";

class RenameModal extends Component {
  state = { name: "initName" };
  onChangeName = (event) => {
    this.setState({ name: event.target.value });
  };
  componentDidMount() {
    let initName = this.props.name;
    this.nameInput.value = initName;
    this.setState({ name: initName });
  }
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={(save) => {
          this.props.handleClose(save, this.props.changingCladeNode, this.state.name);
        }}
        title={`Rename cluster: ${this.props.name}`}
      >
        <TextField
          id='rename-clade-text'
          label='New Name for cluster'
          defaultValue={this.state.name}
          onChange={this.onChangeName}
          margin='dense'
          variant='outlined'
          inputRef={(el) => (this.nameInput = el)}
        />
      </ModalOwn>
    );
  }
}

export default RenameModal;
