import React, {Component} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from "react-bootstrap/Button";





//Statistical Dialog. Allows user to select statistical computations and adapt details for chosen statistic test.
//Checks if requirements for chosen computation are given, asks for upload of needed data if not.
//Can be extended by other statistical tests/computations, currently only GO enrichment possible
class StatisticsModal extends Component{
	state = { };
    /*check if files needed to compute go enrichment have         *been uploaded. If so, start go-enrichment dialog, *otherwise ask for upload of needed files
    */
   	enrichmentPossible = () => {
        console.log("enrichmentPossible?");
        console.log(this.props.goFilesUploaded)
            if(this.props.goFilesUploaded){
                this.props.showGOModal();
            }
            else{
                this.props.showUploadGOFilesModal();
            }
  };
    
   render() {
	
    return (
        //statistics dialog
        //can be extended by adding additional modals as shown for GO enrichment
    <div>
      <Modal
        
        id = "statistic-modal"
        show={this.props.show}
        onHide={this.props.handleClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Compute Statistics for Subtree</Modal.Title>
        </Modal.Header>
        <Modal.Body>
         <Button id= "go" variant= "light" onClick={this.enrichmentPossible}>
         Gene Ontology Enrichment
         </Button>
        </Modal.Body>
      </Modal>

      </div>
    
);
       
}}


export default StatisticsModal

