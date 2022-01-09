// File: go-table.jsx
// Table for listing go-enrichment results
// Written by Sophie Pesch 2021


import React, { Component } from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
  render() {
    return (
      <GOTable supportingSNPs={this.props.supportingSNPs} nonSupportingSNPs={this.props.nonSupportingSNPs} go_to_snps={this.props.go_to_snps} hideSNPsforGoTerm={this.props.hideSNPsforGoTerm} handleMultipleSNPadditon={this.props.handleMultipleSNPadditon} showSNPsforGoTerm={this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow} rows={this.props.input} />
    );

  }

}
class GOTable extends React.Component {

  render() {
    var rows = new Set();
    let supportingSNPs = this.props.supportingSNPs
    let nonSupportingSNPs = this.props.nonSupportingSNPs
    //var row = null;
    //var go_term = "";
    //var snpsShow = this.props.snpsShow;
    for (var r = 0; r < this.props.rows.length; r++) {
      const go_term = this.props.rows[r].go_term;
      const supSnps = new Set(this.props.go_to_snps[go_term].filter(i => supportingSNPs.has(i)))
      const supSnpsSize = supSnps.size
      const nonSupSnps = new Set(this.props.go_to_snps[go_term].filter(i => nonSupportingSNPs.has(i)))
      const nonSupSnpsSize = nonSupSnps.size

      const id = this.props.rows[r].id;
      const row = <GORow
        // handleMultipleSNPadditon={() => this.props.handleMultipleSNPadditon} showSNPsforGoTerm={() => this.props.showSNPsforGoTerm} 
        showSupSNPs={(supSnpsSize > 0)}
        showNonSupSNPs={(nonSupSnpsSize > 0)}
        snpsShow={this.props.snpsShow}
        row={this.props.rows[r]}
        key={this.props.rows[r].id}
        button={<Button
          onClick={() => { this.props.showSNPsforGoTerm(go_term, id, "sup", supSnps) }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> show sup. SNPs ({supSnpsSize})
        </Button>}
        hidebutton={<Button
          onClick={() => { this.props.hideSNPsforGoTerm(go_term, id, "sup", supSnps) }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}>hide sup. SNPs ({supSnpsSize})
        </Button>}
        buttonNonSup={<Button
          onClick={() => { this.props.showSNPsforGoTerm(go_term, id, "nonsup", nonSupSnps) }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> show non. sup. SNPs ({nonSupSnpsSize})
        </Button>}
        hidebuttonNonSup={<Button
          onClick={() => { this.props.hideSNPsforGoTerm(go_term, id, "nonsup", nonSupSnps) }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> hide non. sup. SNPs  ({nonSupSnpsSize})
        </Button>}
      />;

      rows.add(row);
    }

    return (
      <table id="table-input" style={{ height: 40, overflowX: "hidden", overflowY: "auto" }} >
        <tbody>
          {rows}

        </tbody>
      </table>
    );

  }
}
class GORow extends React.Component {

  render() {
    var color = 'white';
    if ((this.props.row.id % 2) === 0) {
      color = 'e9e9e9'
    }
    //console.log(this.props.showSnps);
    return (
      <tr className="eachRow" bgcolor={color}>
        <td style={{ width: 100 }}>
          {this.props.row.go_term}
        </td>
        <td style={{ width: 120, marginLeft: 5 }}>
          {this.props.row.description}
        </td>
        <td style={{ width: 100 }}>
          {this.props.row.p_value.toExponential(3)}
        </td>
        <td style={{ width: 120 }}>
          {(!this.props.snpsShow[this.props.row.id][0] && this.props.showSupSNPs) && (
            this.props.button)}
          {(this.props.snpsShow[this.props.row.id][0] && this.props.showSupSNPs) && (
            this.props.hidebutton)}
          {(!this.props.snpsShow[this.props.row.id][1] && this.props.showNonSupSNPs) && (
            this.props.buttonNonSup)}
          {(this.props.snpsShow[this.props.row.id][1] && this.props.showNonSupSNPs) && (
            this.props.hidebuttonNonSup)}
        </td>
      </tr>
    );

  }


}

export default Table
