// File: go-modal.jsx
// Pop-Up-window providing go-enrichment request
// Written by Sophie Pesch 2021

import React, {Component} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';


class GOModal extends Component{
  //show-state for additonal test-modals can be added here:
  state = {};
  
  
  render() {
    return (
      //statistics dialog
      //can be extended by adding additional modals as shown for GO enrichment
      <div>
        <Modal
          id = "go-modal"
          show={this.props.show}
          onHide={this.props.handleClose}
          backdrop="static"
          keyboard={false}
          centered
	  >
          <Modal.Header closeButton>
            <Modal.Title>GO Enrichment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form id="go-enrichment" onSubmit={this.props.sendStatisticsRequest}>
              <Form.Group id = "group">
		<Form.Label>Significance Level:</Form.Label>
		<Form.Control id= "sig-level" type="text" defaultValue = "0.05"/>
              </Form.Group>
              <Button variant= 'primary' type='submit'>
		Compute Enrichment
              </Button>
              
            </Form>
          </Modal.Body>
	  
          
	</Modal>
      </div>
      
    );
    
  }}


export default GOModal

