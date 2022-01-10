// File: go-table-header.jsx
// Header of go-enrichment result table
// Written by Sophie Pesch 2021

import React, { Component } from "react";
import Button from "react-bootstrap/Button";


class TableHeader extends Component {

  render() {
    return (
      <div style={{ marginLeft: 15, marginRight: 15, height: 40 }}>
        <table id="table-head"  >
          <thead>
            <tr>
              <th style={{ width: 100 }}>GO-Term</th>
              <th style={{ width: 120, marginLeft: 5 }}>Description</th>
              <th style={{ width: 100 }}>P-Value</th>
              <th style={{ width: 120 }}>
                <Button id="all-snps" variant="light" onClick={this.props.hideSNPs} style={{ float: 'right' }}>
                  hide all SNPs
                </Button></th>
            </tr>
          </thead>
        </table>
      </div>

    );

  }

}


export default TableHeader 
