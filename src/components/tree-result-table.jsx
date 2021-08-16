import React, {Component} from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
  render() {
    //console.log(this.props.input)
    return (
      <div>
        <CladeTable showCladeResults={this.props.showCladeResults}
                    cladeMarked = {this.props.cladeMarked}
                    markClade = {this.props.markClade}
                    unmarkClade = {this.props.unmarkClade}
                    rows={this.props.input} />
      </div>
    );

  }

}
class CladeTable extends React.Component {

  render() {
    var rows = new Set();
    for (var r=0; r<this.props.rows.length; r++){
      console.log("row: ",this.props.rows[r]);
      const id = this.props.rows[r].id;
      const c_root = this.props.rows[r].root;
      const size = this.props.rows[r].subtree_size;
      const snps = this.props.rows[r].num_snps;
      const sig_terms = this.props.rows[r].num_sig_terms;
      const result = this.props.rows[r].result;
      const row = <CladeRow
                      cladeMarked = {this.props.cladeMarked}
                      showCladeResults = {() => this.props.showCladeResults}
                      row={this.props.rows[r]}
                      key = {this.props.rows[r].id}
                      button={ <Button
                               onClick={() => {this.props.showCladeResults(c_root, size, snps, sig_terms, result)}} variant='light'
                               style = {{margin:5}}> show clade results
                               </Button>  }
                      mark_button={ <Button
                               onClick={() => {this.props.markClade(c_root, id)}} variant='light'
                               style = {{margin:5}}> mark clade
                               </Button>  }
                      unmark_button={ <Button
                               onClick={() => {this.props.unmarkClade(c_root, id)}} variant='light'
                               style = {{margin:5}}> unmark clade
                               </Button>  }
                   />;
      rows.add(row);
    }

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
class CladeRow extends React.Component {

  render() {
    var color = 'white';
    if((this.props.row.id % 2) === 0){
      color = 'e9e9e9'
    }
    //console.log(this.props.showSnps);
    return (
      <tr className="eachRow" bgcolor={color}>
        <td style = {{width:110, padding:10}}>
              {this.props.row.id}
        </td>
        <td style = {{width:50}}>
            {this.props.button}
        </td>
        <td style = {{width:50}}>
            {!this.props.cladeMarked[this.props.row.id]&&(this.props.mark_button)}
            {this.props.cladeMarked[this.props.row.id]&&(this.props.unmark_button)}

        </td>
      </tr>
    );

  }


}

export default Table
