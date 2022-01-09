// File: tree-result-modal.jsx
// Pop-Up-window for visualization of tree analysis results
// Written by Sophie Pesch 2021

import React from "react";
import { Component } from "react";
import Modal from 'react-bootstrap/Modal';
import ModalDialog from 'react-bootstrap/ModalDialog';
import Draggable from "react-draggable";
import GOResultModal from "./go-result-modal";
import Button from "react-bootstrap/Button";
import Table from './tree-result-table';
import "./test_styles.css";


class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable handle=".modal-header">
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}

class TreeResultModal extends Component {
  constructor(props) {
    super(props);
    this.showClades = this.showClades.bind(this);
    this.hideClades = this.hideClades.bind(this);
    this.showCladeResults = this.showCladeResults.bind(this);
    this.closeCladeResults = this.closeCladeResults.bind(this);
    this.markClade = this.markClade.bind(this);
    this.unmarkClade = this.unmarkClade.bind(this);
    this.exportTreeResult = this.exportTreeResult.bind(this);

  }
  state = {
    tableInput: this.createTableInputFormat(this.props.tree_result),
    cladeMarked: Array.from({ length: Object.keys(this.props.tree_result).length + 1 }).map(x => false),
    significant_clades: Object.keys(this.props.tree_result).length,
    allCladesShow: true,
    singleCladeShow: false,
    cladeTableShow: false,
    curr_subtree_size: 0,
    curr_subtree_snps: 0,
    curr_sig_terms: 0,
    curr_result: [],
    curr_nodes: [],
    curr_clade: [],
  }

  createTableInputFormat(tree_result) {
    //console.log(tree_result, typeof(tree_result));
    var id = 0;
    var input = [];
    for (var key in tree_result) {
      var clade = tree_result[key];
      //console.log("clade:", key,clade);
      var row_dict = {};
      row_dict["id"] = id;
      row_dict["root"] = key;
      row_dict["clade"] = clade["subtree"];
      row_dict["result"] = clade["result"];
      row_dict["subtree_size"] = clade["subtree_size"];
      row_dict["num_snps"] = clade["num_snps"];
      row_dict["in_gene_clade"] = clade["in_gene_clade"];
      row_dict["num_go_terms"] = clade["num_go_terms"];
      row_dict["num_sig_terms"] = clade["result"].length;

      id++;
      input.push(row_dict)
    }
    return input;
  }

  showClades() {
    this.setState({ cladeTableShow: true })
  }
  hideClades() {
    this.setState({ cladeTableShow: false })
  }
  showCladeResults(root_id, clade_size, clade_snps, in_gene_clade, clade_sig_terms, clade_result) {
    const root = this.props.tree.get_nodes().filter(node => (String(node.tempid) === String(root_id)))[0];
    const descendants = this.props.tree.select_all_descendants(root, true, true);
    //console.log("root",root, descendants);
    this.setState({
      curr_subtree_snps: clade_snps,
      curr_in_gene_clade: in_gene_clade,
      curr_subtree_size: clade_size,
      curr_sig_terms: clade_sig_terms,
      curr_result: clade_result,
      curr_clade: [root, descendants],
      singleCladeShow: true,
      allCladesShow: false
    });
  }
  closeCladeResults() {
    this.setState({
      curr_subtree_snps: 0,
      curr_in_gene_clade: 0,
      curr_subtree_size: 0,
      curr_sig_terms: 0,
      curr_result: [],
      singleCladeShow: false,
      allCladesShow: true
    });
  }
  markClade(root_id, id) {
    const root = this.props.tree.get_nodes().filter(node => (String(node.tempid) === String(root_id)));
    const descendants = this.props.tree.select_all_descendants(root[0], true, true);
    this.props.tree.modify_selection(
      descendants,
      undefined,
      undefined,
      undefined,
      "true",
    );
    var curr_state = this.state.cladeMarked;
    curr_state[id] = true;
    this.setState({ cladeMarked: curr_state });
  }
  unmarkClade(root_id, id) {
    const root = this.props.tree.get_nodes().filter(node => (String(node.tempid) === String(root_id)));
    const descendants = root.concat(this.props.tree.select_all_descendants(root[0], true, true));
    this.props.tree.modify_selection(
      descendants,
      undefined,
      undefined,
      undefined,
      "false",
    );
    var curr_state = this.state.cladeMarked;
    curr_state[id] = false;
    this.setState({ cladeMarked: curr_state });
  }

  downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    csvFile = new Blob([csv], { type: "text/csv" });
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();

  }

  exportTreeResult() {
    // var csv = ["a,b,c\n"]
    var csv = "";
    if (Object.keys(this.props.tree_result).length !== 0) {
      for (var key in this.props.tree_result) {
        var clade = this.props.tree_result[key];
        var result = clade["result"];
        csv += this.createCSV(result, key);
      }
    }
    this.downloadCSV(csv, "tree_analysis_result.csv");
  }

  createCSV(clade_result, clade_root_id) {
    var clade = this.get_clade_leaves(clade_root_id);
    var csv = "";
    clade.join();
    csv += clade + '\n'
    clade_result.forEach(go => {
      csv += '"' + go[0] + '","' + go[2] + '","' + go[1] + '"\n'
    });
    return [csv];
  }

  get_clade_leaves(root_id) {
    const root = this.props.tree.get_nodes().filter(node => (String(node.tempid) === String(root_id)))[0];
    if (this.props.tree.is_leafnode(root)) {
      return [root.name]
    }
    else {
      const leaves = this.props.tree.select_all_descendants(root, true, false);
      const names = leaves.map(leave => String(leave.name));
      //console.log("leaves: ", leaves);
      return names;
    }
  }


  render() {
    return (
      <div className="container">
        {this.state.allCladesShow && (
          <Modal
            dialogAs={DraggableModalDialog}
            id="tree-result-modal"
            show={this.props.show}
            onHide={this.props.handleClose}
            backdrop={'static'}
            centered
            scrollable
            dialogClassName='tree-result-dialog'
          >
            <Modal.Header closeButton>
              <Modal.Title>Tree analysis result</Modal.Title>
            </Modal.Header>
            <div style={{ margin: 15 }} >
              Found {this.state.significant_clades} clade(s) with significant results
              {!(this.state.cladeTableShow) && (
                <Button id="clades" variant="light" onClick={this.showClades} style={{ float: 'right' }}>
                  show clades
                </Button>
              )}
              {this.state.cladeTableShow && (
                <Button id="clades" variant="light" onClick={this.hideClades} style={{ float: 'right' }}>
                  hide clades
                </Button>
              )}
            </div>
            {this.state.cladeTableShow && (
              <table id="treetable" style={{ marginLeft: 15, height: 40, overflow: 'auto' }} >
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Clade-ID</th>
                    <th style={{ width: 170 }} />
                    <th style={{ width: 100 }} />
                  </tr>
                </thead>
              </table>
            )}

            <Modal.Body className="body">
              {this.state.cladeTableShow && (
                <Table showCladeResults={this.showCladeResults}
                  cladeMarked={this.state.cladeMarked}
                  markClade={this.markClade}
                  unmarkClade={this.unmarkClade}
                  input={this.state.tableInput} />
              )}
            </Modal.Body>
            <Modal.Footer>
              <div id='container' style={{ marginTop: 0, marginBottom: 10, padding: 0 }}>
                <div id='tree' style={{ width: 480, marginRight: 0, padding: 0 }}>
                  <Button id="export" variant='light' onClick={this.exportTreeResult} style={{ marginLeft: 20, float: 'right' }} >
                    Export Results
                  </Button>
                  <div style={{ float: 'right', marginLeft: 20 }}>
                    tree-size: {this.props.tree_size}<br />
                    SNPs: {this.props.tree_snps}<br />
                    in Genes: {this.props.in_gene_tree}
                  </div>
                </div>
              </div>
            </Modal.Footer>
          </Modal>

        )}
        {this.state.singleCladeShow && (
          <GOResultModal
            id="clade-result"
            show={this.state.singleCladeShow}
            handleClose={this.closeCladeResults}
            go_result={this.state.curr_result}
            numOfSigGoTerms={this.state.curr_sig_terms}
            tree_size={this.props.tree_size}
            tree_snps={this.props.tree_snps}
            in_gene_tree={this.props.in_gene_tree}
            subtree_size={this.state.curr_subtree_size}
            subtree_snps={this.state.curr_subtree_snps}
            in_gene_clade={this.state.curr_in_gene_clade}
            go_to_snps={this.props.go_to_snps}
            handleMultipleSNPadditon={this.props.handleMultipleSNPadditon}
            visualizedSNPs={this.props.visualizedSNPs}
            handleHideSNPs={this.props.handleHideSNPs}
            tree={this.props.tree}
            clade={this.state.curr_clade}
            root={this.state.curr_clade[0]}
          />
        )
        }
      </div>
    );
  }
}
export default TreeResultModal