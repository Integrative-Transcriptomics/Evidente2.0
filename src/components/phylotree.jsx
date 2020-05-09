import * as d3 from "d3";
import "../../node_modules/phylotree/phylotree";
import * as $ from "jquery";
import * as _ from "lodash";

import * as bootbox from "bootbox";
import React, { Component } from "react";
class Phylotree extends Component {
  state = {};
  constructor() {
    super();
  }
  nodeStyler = (container, node) => {
    let div = d3.select("#tooltip");
    let lookFor = node.collapsed ? node["show-name"] : node.name; // Either clade or leaf
    if (d3.layout.phylotree.is_leafnode(node) || node["own-collapse"]) {
      container
        .selectAll("circle")
        .style("fill", "black")
        .on("mouseover", () => {
          if (!node.selected) {
            d3.selectAll(`.${lookFor}.guides`).style("stroke", "red").style("stroke-opacity", 0.75);
          }
          div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
          div
            .html(lookFor)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          if (!node.selected) {
            d3.selectAll(`.${lookFor}.guides`)
              .style("stroke", "gray")
              .style("stroke-opacity", 0.25);
          }
          div.transition().duration(500).style("opacity", 0);
        });
    }
  };
  my_collapse(node) {
    node["own-collapse"] = !node["own-collapse"];
    if (node["own-collapse"]) {
      node["show-name"] = this.props.onCollapse(node);
    } else {
      node["show-name"] = "";
      this.props.onDecollapse(node);
    }
    this.props.onSelection(this.props.tree.get_selection());
    d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
  }

  renameClade(node) {
    bootbox.prompt({
      title: `Please insert the new name for the clade named "${node["show-name"]}" `,
      centerVertical: true,
      callback: (name) => {
        if (name) {
          // TODO: Catch that the name is not already given!!!!
          name = name.replace(/ /g, "-");
          let oldName = node["show-name"];
          node["show-name"] = name;
          this.props.onCladeUpdate(oldName, name);
          this.props.tree.update();
          d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
        }
      },
    });
  }

  show_node_snps(node) {
    let node_name = [this.props.ids.numToLabel[node.tempid]];
    let descendants = this.props.tree
      .descendants(node)
      .filter((d) => d.tempid !== node.tempid)
      .map((d) => this.props.ids.numToLabel[d.tempid]);
    let supportSNPs = this.props.snpdata.support;
    let notSupportSNPs = this.props.snpdata.notsupport;
    const modifyListOfSNPs = (listSNPs, listNames) =>
      _.uniqWith(
        listSNPs
          .filter((snp) => listNames.includes(snp.node))
          .map((snp) => ({ pos: snp.pos, allele: snp.allele }))
          .sort((a, b) => d3.ascending(parseInt(a.pos), parseInt(b.pos))),
        _.isEqual
      );
    let supportSNPTable = {
      actualNode: modifyListOfSNPs(supportSNPs, node_name),
      descendants: modifyListOfSNPs(supportSNPs, descendants),
    };

    let nonSupportSNPTable = {
      actualNode: modifyListOfSNPs(notSupportSNPs, node_name),
      descendants: modifyListOfSNPs(notSupportSNPs, descendants),
    };
    this.props.updateSNPTable(supportSNPTable, nonSupportSNPTable);
    $("#supportingSNPs-header").click();
  }

  my_hide(node) {
    if (!node["hidden-t"]) {
      node["hidden-t"] = !node["hidden-t"];
      this.props.tree
        .modify_selection(
          [node].concat(this.props.tree.select_all_descendants(node, true, true)),
          "notshown",
          true,
          true,
          "true"
        )
        .update_has_hidden_nodes()
        .update();

      d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
      this.props.onHide(this.props.tree.descendants(node));
      this.props.onSelection(this.props.tree.get_selection());
    }
  }

  my_showNodes(node) {
    if (node.has_hidden_nodes || false) {
      this.props.tree.modify_selection(
        this.props.tree.select_all_descendants(node, true, true),
        "hidden-t",
        true,
        true,
        "false"
      );
      this.props.tree
        .modify_selection(
          this.props.tree.select_all_descendants(node, true, true),
          "notshown",
          true,
          true,
          "false"
        )
        .update_has_hidden_nodes()
        .update();
      this.props.onShowNodes(this.props.tree.descendants(node));
      d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
      this.props.onSelection(this.props.tree.get_selection());
    }
  }
  shouldComponentUpdate(nextProp, nextState) {
    return nextProp.newick && nextProp.newick !== this.props.newick;
  }
  componentDidUpdate(prevProp) {
    this.renderTree(this.props.newick);
    d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
  }
  componentDidMount() {
    this.props.tree
      .size([this.container.offsetHeight, this.container.offsetWidth])
      .svg(d3.select("#tree-display"));
  }

  renderTree(example_tree) {
    this.props.tree(example_tree).style_nodes(this.nodeStyler).layout();
    this.props.onUploadTree(this.props.tree.get_nodes());
    let count = 1;
    this.props.tree.traverse_and_compute((d) => {
      d.tempid = count;
      count = count + 1;
      return d;
    });
    this.props.tree.get_nodes().forEach((tnode) => {
      d3.layout.phylotree.add_custom_menu(
        tnode,
        () => "Show SNPs from Node",
        () => this.show_node_snps(tnode),
        () => true
      );

      d3.layout.phylotree.add_custom_menu(
        tnode,
        (node) => (node["own-collapse"] ? "Decollapse subtree" : "Collapse substree"),
        () => this.my_collapse(tnode, this.props.tree, this.props.onZoom, this.props.onCollapse),
        () => !d3.layout.phylotree.is_leafnode(tnode)
      );
      d3.layout.phylotree.add_custom_menu(
        tnode, // add to this node
        (node) => "Hide this " + (d3.layout.phylotree.is_leafnode(node) ? "node" : "subtree"), // display this text for the menu
        () => this.my_hide(tnode, this.props.tree, this.props.onZoom),
        (node) => node.name !== "root" // condition on when to display the menu
      );
      d3.layout.phylotree.add_custom_menu(
        tnode, // add to this node
        (node) => (node.has_hidden_nodes || false) && "Show the hidden nodes", // display this text for the menu
        () => this.my_showNodes(tnode),
        (node) => node.has_hidden_nodes || false
      );
      d3.layout.phylotree.add_custom_menu(
        tnode, // add to this node
        (node) => (node["own-collapse"] || false) && "Rename clade", // display this text for the menu
        () => this.renameClade(tnode),
        (node) => node["own-collapse"] || false
      );
    });
    this.runSelection();
  }

  runSelection = () => {
    this.props.tree.selection_callback((selection) => {
      this.props.onSelection(selection);
    });
  };

  render() {
    return (
      <div className='lchild' ref={(el) => (this.container = el)}>
        <svg id='tree-display'></svg>
      </div>
    );
  }
}

export default Phylotree;
