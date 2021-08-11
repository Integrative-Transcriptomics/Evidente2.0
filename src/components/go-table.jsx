import React, {Component} from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
  render() {
    console.log(this.props.input)
    return (
      <div>
        <GOTable hideSNPsforGoTerm={this.props.hideSNPsforGoTerm} handleMultipleSNPadditon = {this.props.handleMultipleSNPadditon} showSNPsforGoTerm={this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow}  rows={this.props.input} />
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
            const id = this.props.rows[r].id;
            const row = <GORow  
                        handleMultipleSNPadditon = {() => this.props.handleMultipleSNPadditon} showSNPsforGoTerm={()=>this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow} 
                        row={this.props.rows[r]} 
                        key = {this.props.rows[r].id} 
                        button={ <Button 
                                    onClick={()=>{this.props.showSNPsforGoTerm(go_term, id)}} variant='light'
                                    style = {{margin:5}}> show SNPs 
                                </Button>  }
                        hidebutton={ <Button 
                                    onClick={()=>{this.props.hideSNPsforGoTerm(go_term, id)}} variant='light'
                                    style = {{margin:5}}> hide SNPs 
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
      var color = 'white';
      if((this.props.row.id % 2) == 0){
          color = 'e9e9e9'
      }
    //console.log(this.props.showSnps);
    return (
      <tr className="eachRow" bgcolor={color}>
      <td style = {{width:90}}>
        {this.props.row.go_term}
      </td>
      <td style = {{width:170}}>
        {this.props.row.description}
      </td>
      <td style = {{width:100, marginLeft:15}}>
        {this.props.row.p_value.toExponential(3)}
      </td>
      <td style = {{width:50}}>
        {!this.props.snpsShow[this.props.row.id]&&(        
                this.props.button)}
        {this.props.snpsShow[this.props.row.id]&&(        
                this.props.hidebutton)}
      </td>
      </tr>
    );

  }


}

export default Table
