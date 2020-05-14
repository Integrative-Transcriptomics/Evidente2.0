import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";

class ModalOwn extends Component {
  state = {};
  render() {
    return (
      <Modal
        animation={false}
        id={this.props.ID}
        show={this.props.show}
        onHide={() => this.props.onClose()}
      >
        <Modal.Header className='ModalHeaderBody' closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='ModalLimited'>{this.props.children}</Modal.Body>
        <Modal.Footer>
          <Button variant='primary' onClick={() => this.props.onClose()}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ModalOwn;
