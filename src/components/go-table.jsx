// File: go-table.jsx
// Table for listing go-enrichment results
// Written by Sophie Pesch 2021


import React, { Component } from "react";
import Button from "react-bootstrap/Button";

class Table extends Component {
  render() {
    return (
      <GOTable hideSNPsforGoTerm={this.props.hideSNPsforGoTerm} handleMultipleSNPadditon={this.props.handleMultipleSNPadditon} showSNPsforGoTerm={this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow} rows={this.props.input} />
    );

  }

}
class GOTable extends React.Component {

  render() {
    var rows = new Set();
    //var row = null;
    //var go_term = "";
    //var snpsShow = this.props.snpsShow;
    for (var r = 0; r < this.props.rows.length; r++) {
      const go_term = this.props.rows[r].go_term;
      const id = this.props.rows[r].id;
      const row = <GORow
        handleMultipleSNPadditon={() => this.props.handleMultipleSNPadditon} showSNPsforGoTerm={() => this.props.showSNPsforGoTerm} snpsShow={this.props.snpsShow}
        row={this.props.rows[r]}
        key={this.props.rows[r].id}
        button={<Button
          onClick={() => { this.props.showSNPsforGoTerm(go_term, id, "sup") }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> show sup. SNPs
        </Button>}
        hidebutton={<Button
          onClick={() => { this.props.hideSNPsforGoTerm(go_term, id, "sup") }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}>hide sup. SNPs
        </Button>}
        buttonNonSup={<Button
          onClick={() => { this.props.showSNPsforGoTerm(go_term, id, "nonsup") }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> show non. sup. SNPs
        </Button>}
        hidebuttonNonSup={<Button
          onClick={() => { this.props.hideSNPsforGoTerm(go_term, id, "nonsup") }} variant='light'
          style={{ margin: 5, fontSize: "12px", width: "90%" }}> hide non. sup. SNPs
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
          {!this.props.snpsShow[this.props.row.id][0] && (
            this.props.button)}
          {this.props.snpsShow[this.props.row.id][0] && (
            this.props.hidebutton)}
          {!this.props.snpsShow[this.props.row.id][1] && (
            this.props.buttonNonSup)}
          {this.props.snpsShow[this.props.row.id][1] && (
            this.props.hidebuttonNonSup)}
        </td>
      </tr>
    );

  }


}

export default Table
