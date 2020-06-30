import * as d3 from "d3";
import "../../node_modules/phylotree/src/phylotree";
// import "../../node_modules/phylotree/src/main";

import * as $ from "jquery";
import * as _ from "lodash";

import * as bootbox from "bootbox";
import React, { Component } from "react";
class Phylotree extends Component {
  nodeStyler = (container, node) => {
    let div = d3.select("#tooltip");
    let lookFor = node.collapsed ? node["show-name"] : node.name; // Either clade or leaf

    if (d3.layout.phylotree.is_leafnode(node) || node.collapsed) {
      container
        .selectAll("circle")
        .style("fill", "black")
        .attr({ r: 2 })
        .on("mouseover", () => {
          d3.selectAll(`.node-${lookFor}.guides`).classed("highlighted-guide", true);
          div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
          div
            .html(lookFor)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          d3.selectAll(`.node-${lookFor}.guides`).classed("highlighted-guide", false);
          div.transition().duration(500).style("opacity", 0);
        });
    } else if (node) {
      container
        .selectAll("circle")
        .style("fill", "lightgray")
        .attr({ r: 3 })
        .on("mouseout", null)
        .on("mouseover", null);
    }
    if (
      this.props.selectedNodeID &&
      this.props.ids.numToLabel[node.tempid] === this.props.selectedNodeID
    ) {
      container.selectAll("circle").style({ fill: "red" }).attr({ r: 5 });
    }
  };
  my_collapse(node) {
    if (!node["own-collapse"]) {
      node["own-collapse"] = true;
      node["show-name"] = this.props.onCollapse(node);
    } else {
      node["show-name"] = "";
      node["own-collapse"] = false;

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
        let given_names = this.props.tree
          .get_nodes()
          .filter((node) => d3.layout.phylotree.is_leafnode(node) || node.collapsed)
          .map((leaf) => (leaf.collapsed ? leaf["show-name"] : leaf["name"]));

        if (name) {
          if (given_names.includes(name)) {
            alert("This name is already given. Try another name.");
          } else {
            name = name.replace(/[^a-zA-Z0-9_-]/g, "_");
            let oldName = node["show-name"];
            node["show-name"] = name;
            this.props.onCladeUpdate(oldName, name);
            this.props.tree.update();
            this.props.onSelection(this.props.tree.get_selection());
            d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
          }
        }
      },
    });
  }

  show_node_snps(node) {
    let node_name = this.props.ids.numToLabel[node.tempid];
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
      actualNode: modifyListOfSNPs(supportSNPs, [node_name]),
      descendants: modifyListOfSNPs(supportSNPs, descendants),
    };

    let nonSupportSNPTable = {
      actualNode: modifyListOfSNPs(notSupportSNPs, [node_name]),
      descendants: modifyListOfSNPs(notSupportSNPs, descendants),
    };
    this.props.updateSNPTable(node_name, supportSNPTable, nonSupportSNPTable);
    this.props.tree.update();
    this.props.onSelection(this.props.tree.get_selection());
    d3.select("#tree-display").call(this.props.onZoom).call(this.props.onZoom.event);
    if (!$("#supportingSNPs-card").hasClass("show")) {
      $("#supportingSNPs-header").click();
    }
  }

  my_hide(node) {
    if (!node["hidden-t"]) {
      node["hidden-t"] = true;
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

  shouldComponentUpdate(nextProp, nextState) {
    return nextProp.newick !== undefined && nextProp.newick !== this.props.newick;
  }
  componentDidUpdate(prevProp) {
    if (prevProp.newick !== this.props.newick) {
      this.renderTree(this.props.newick);
    }
  }
  componentDidMount() {
    let margin_top = this.container.offsetHeight * 0.05;
    this.props.tree.size([this.container.offsetHeight, this.container.offsetWidth]).svg(
      d3
        .select(this.container)
        .append("svg")
        .attr("id", "tree-display")
        .attr({ height: this.container.offsetHeight, width: this.container.offsetWidth })
        .append("g")
        .attr("id", "transform-group")
        .attr("transform", `translate(${[0, margin_top]})`)
    );
  }

  renderTree(input_tree) {
    this.props.tree(input_tree).style_nodes(this.nodeStyler).layout();
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
        () => "Show the hidden nodes", // display this text for the menu
        () => this.props.onShowMyNodes(tnode),
        (node) => node.has_hidden_nodes || node.name === "root" || false
      );
      d3.layout.phylotree.add_custom_menu(
        tnode, // add to this node
        (node) => (node["own-collapse"] || false) && "Rename clade", // display this text for the menu
        () => this.renameClade(tnode),
        (node) => node["own-collapse"] || false
      );
    });
    d3.select("#tree-display").call(this.props.onZoom).call(this.props.onDrag);

    this.runSelection();
  }

  runSelection = () => {
    this.props.tree.selection_callback((selection) => {
      this.props.onSelection(selection);
    });
  };

  render() {
    return <div className='lchild' ref={(el) => (this.container = el)}></div>;
  }
}

export default Phylotree;
