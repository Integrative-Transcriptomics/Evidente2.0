import React, {Component} from "react";
import Button from "react-bootstrap/Button";


class TableHeader extends Component {
 
  render() {
    return (
    <table id="table" style = {{marginLeft:15, height: 40, overflow:'auto'}} >
          <thead>
            <tr>
              <th style = {{width:90}}>GO-Term</th>
              <th style = {{width:170}}>Description</th>
              <th style = {{width:100}}>P-Value</th>
              <th>  <Button id= "all-snps" variant= "light" onClick={this.props.hideSNPs} style={{float:'right'}}>
                    hide all SNPs
                </Button></th>
            </tr>
          </thead>
        </table>
    );

  }

}


export default TableHeader 
