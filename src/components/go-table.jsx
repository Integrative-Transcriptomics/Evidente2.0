import React, {Component} from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
 
  render() {
    console.log(this.props.input)
    return (
      <div>
        <GOTable showSnps={this.props.showSnps}  rows={this.props.input} />
      </div>
    );

  }

}
class GOTable extends React.Component {

  render() {
    var showSnps = this.props.showSnps
    var row = this.props.rows.map(function(row) {
      return (<GORow showSnps={showSnps} row={row} key = {row.id}/>)
    });
    return (  
      <div>
        <table id="table" style = {{marginTop:15, height: 50}} >
          <thead>
            <tr>
              <th>GO-Term</th>
              <th>Description</th>
              <th>P-Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {row}
          </tbody>
        </table>
      </div>
    );

  }
}
class GORow extends React.Component {

  render() {
    console.log(this.props.showSnps);
    return (
      <tr className="eachRow">
      <td style = {{width:90}}>
        {this.props.row.go_term}
      </td>
      <td style = {{width:150}}>
        {this.props.row.description}
      </td>
      <td style = {{width:100}}>
        {this.props.row.p_value}
      </td>
      <td style = {{width:50}}>
        {this.props.showSnps[this.props.row.id]&&(
            <ShowSNPButton/>
        )}
      </td>
      </tr>
    );

  }


}

class ShowSNPButton extends Component{
    render(){
        return(
            <Button variant='light'style = {{margin:5}}> show SNPs </Button>
        );
    }}
export default Table
