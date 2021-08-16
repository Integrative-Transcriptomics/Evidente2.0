import React, {Component} from "react";
import Button from "react-bootstrap/Button";


class TreeTableHeader extends Component {
  
  render() {
    return (
      <table id="treetable" style = {{marginLeft:15, height: 40, overflow:'auto'}} >
        <thead>
          <tr>
            <th style = {{width:90}}>Clade-ID</th>
            <th style = {{width:170}}></th>
            <th style = {{width:100}}></th>
          </tr>
        </thead>
      </table>
    );

  }

}


export default TreeTableHeader
