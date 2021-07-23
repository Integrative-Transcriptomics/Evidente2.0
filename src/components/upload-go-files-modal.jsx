import React, {Component} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from "react-bootstrap/Button";






class UploadGOFilesModal extends Component{
	state = { };
	
    
   render() {
    return (
      <Modal
        
        id = "upload-files-modal"
        show={this.props.show}
        onHide={this.props.handleClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>File upload required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        Please upload gff- and go-annotation-file in the menu on the right under "Load statistics files" to compute GO enrichments
        </Modal.Body>
        <Modal.Footer>
         <Button id= "go" variant= "primary" onClick={this.props.handleClose} style={{float: 'right'}}>
            Okay
         </Button>
         </Modal.Footer>
      </Modal>
    );
}}


export default UploadGOFilesModal
