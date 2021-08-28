// File: upload-files-modal.jsx
// Pop-Up-window to inform user about necessary file-uploads
// Written by Sophie Pesch 2021


import React, {Component} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from "react-bootstrap/Button";


class UploadFilesModal extends Component{
  state = { };
  
  
  render() {
    
    return (
      <Modal
        
        id = "upload-files-modal"
        show={this.props.show}
        onHide={this.props.handleClose}
        //backdrop="static"
        keyboard={false}
        centered
	>
        <Modal.Header>
          <Modal.Title>File Upload required</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          Please upload statistic files in the menu on the right to compute statistics
        </Modal.Body>
        <Modal.Footer>
          <Button id= "go" variant= "primary" onClick={this.props.handleClose} style={{float: 'right'}}>
            Okay
          </Button>
        </Modal.Footer>
        
	
      </Modal>
    );
    
  }}


export default UploadFilesModal
