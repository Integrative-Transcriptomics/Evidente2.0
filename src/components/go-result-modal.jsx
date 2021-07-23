import React, {Component} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from "react-bootstrap/Button";
import Table from './go-table';



class GOResultModal extends Component{
	state = {
        tableInput: [{id: 0, go_term: "GO22222", description: "this is a test", p_value: 0.004},
        {id: 1, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 2, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 3, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 4, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 5, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 6, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 7, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 8, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 9, go_term: "GO22222", description: "this is a test", p_value : 0.004},
        {id: 10, go_term: "GO22222", description: "this is a test", p_value : 0.004}],
        //this.createTableInputFormat(this.props.go_result),
        goTermsShow : true,
        pValuesShow : Array.from({lenght:10}).map(x => true),//Array.from({length:this.props.go_result.length+1}).map(x => true),
        snpsShow :Array.from({length:11}).map(x => true)
    };
  createTableInputFormat(go_result){
      var id = 0;
      var input = [];
      go_result.forEach(go => {
        var row_dict = {};
        row_dict["id"] = id;
        row_dict["go_term"] = go[0];
        row_dict["description"] = go[2];
        row_dict["p_value"] = Math.round(go[1] * 10000) / 10000  // 3.14go[1];
        id++;
        input.push(row_dict)
      });
      console.log(input);
      return input;
      
  }

   render() {
       console.log("go-result-modal:",this.state.tableInput);
	
    return (
        //statistics dialog
        //can be extended by adding additional modals as shown for GO enrichment
    <div>
      <Modal

        id = "go-result-modal"
        subtree_size = {this.props.subtree_size}
        show={this.props.show}
        onHide={this.props.handleClose}
        backdrop="static"
        keyboard={false}
        centered
        scrollable
        size = 'fixed'
        position = 'fixed'
        fullscreen = 'lg-down'
        >
        <Modal.Header closeButton>
          <Modal.Title>GO enrichment result</Modal.Title>
        </Modal.Header>
        <Modal.Body >
        Found {this.props.numOfSigGoTerms} significant GO terms
         <Button id= "go-terms" variant= "light" onClick={this.props.showGoTerms} style={{float:'right'}}>
         show terms
         </Button>
         <Table showSnps={this.state.snpsShow} input = {this.state.tableInput}/>
         </Modal.Body>
        <Modal.Footer>
        <div id='container'style={{marginTop:0, marginBottom:10, padding:0}}>
            <div id='subtree'style={{ float:'left', marginRight:100}}>
                subtree-size: {this.props.subtree_size}<br/>
                SNPs: {this.props.subtree_snps}
            </div>
            <div id='tree'style={{width:440,marginRight:0,padding:0}}>
              <Button id="export" variant='light' onClick={this.props.exportGoResult}style={{ marginLeft:40,float:'right'}} >
               Export Results
             </Button>
                tree-size: {this.props.tree_size}<br/>
                SNPs: {this.props.tree_snps}
               
            </div>
           
        </div>
        </Modal.Footer>

        </Modal>
        

      </div>
    
);
       
}}


export default GOResultModal

