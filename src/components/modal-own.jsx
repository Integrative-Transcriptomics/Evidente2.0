import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";
/**
 * Basis Modal for different pop-up classes
 */
class ModalOwn extends Component {
  state = {};

  render() {
    return (
      <Modal
        animation={false}
        id={this.props.id}
        show={this.props.show}
        onHide={() => {
          this.props.onClose(false);
        }}
	>
        <Modal.Header className='ModalHeaderBody' closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='ModalLimited'>{this.props.children}</Modal.Body>
        <Modal.Footer>
          {this.props.secondButtonName && (
            <Button
              variant='secondary'
              onClick={() => {
                this.props.onClose(false);
              }}
              >
              {" "}
              {this.props.secondButtonName}
            </Button>
          )}
        <Button
      id={this.props.buttonId || undefined}
      variant='primary'
      onClick={() => {
        this.props.onClose(true);
      }}
        >
        {this.props.buttonName ? this.props.buttonName : "Save Changes"}
      </Button>
        </Modal.Footer>
	</Modal>
    );
  }
}

export default ModalOwn;
