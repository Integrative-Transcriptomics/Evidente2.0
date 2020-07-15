import React, { Component } from "react";
import ModalOwn from "./modal-own";

class WelcomeModal extends Component {
  state = { show: true };
  close = (value) => {
    this.setState({ show: false });
  };
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.state.show}
        onClose={this.close}
        buttonName={"Loading..."}
        buttonId={"welcome-modal-button"}
        title='Evidente'
      >
        <p>
          Evidente is loaded with a default toy example with seven taxa, five SNPs and four
          different metadata, in order for you to get to know this tool. In order to upload your own
          files, please direct yourself to the "Load files" menu.
        </p>
      </ModalOwn>
    );
  }
}

export default WelcomeModal;
