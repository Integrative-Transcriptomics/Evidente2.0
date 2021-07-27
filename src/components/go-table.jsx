import React, {Component} from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
  render() {
    console.log(this.props.input)
    return (
      <div>
        <GOTable handleMultipleSNPadditon = {this.props.handleMultipleSNPadditon} showSNPsforGoTerm={this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow}  rows={this.props.input} />
      </div>
    );

  }

}
class GOTable extends React.Component { 
     constructor (props) {
          super(props);
      }
    
    render() {
    var rows = new Set();
    var row = null;
    var go_term = "";
    var snpsShow = this.props.snpsShow;
    for (var r=0; r<this.props.rows.length; r++){
            console.log("row: ",this.props.rows[r]);
            const go_term = this.props.rows[r].go_term;
            const row = <GORow  
                        handleMultipleSNPadditon = {() => this.props.handleMultipleSNPadditon} showSNPsforGoTerm={()=>this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow} 
                        row={this.props.rows[r]} 
                        key = {this.props.rows[r].id} 
                        button={ <Button 
                                    onClick={()=>{this.props.showSNPsforGoTerm(go_term)}} variant='light'
                                    style = {{margin:5}}> show SNPs 
                                </Button>  }
                        />;

            console.log("go term", go_term);
            rows.add(row);            
    }
    console.log("rows: ", rows);

    return (  
      <div>
        <table id="table" style = {{ height: 40, overflow:'auto'}} >
          <tbody>
        {rows}
           
          </tbody>
        </table>
      </div>
    );

  }
}
class GORow extends React.Component {

  render() {
    //console.log(this.props.showSnps);
    return (
      <tr className="eachRow">
      <td style = {{width:90}}>
        {this.props.row.go_term}
      </td>
      <td style = {{width:170}}>
        {this.props.row.description}
      </td>
      <td style = {{width:100}}>
        {this.props.row.p_value}
      </td>
      <td style = {{width:50}}>
        {!this.props.snpsShow[this.props.row.id]&&(        
                this.props.button)}
      </td>
      </tr>
    );

  }


}

export default Table
