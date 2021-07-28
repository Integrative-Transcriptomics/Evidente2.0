import React, {Component} from "react";

class TableHeader extends Component {
 
  render() {
    return (
    <table id="table" style = {{marginLeft:15, height: 40, overflow:'auto'}} >
          <thead>
            <tr>
              <th style = {{width:90}}>GO-Term</th>
              <th style = {{width:170}}>Description</th>
              <th style = {{width:100}}>P-Value</th>
              <th></th>
            </tr>
          </thead>
        </table>
    );

  }

}


export default TableHeader 
