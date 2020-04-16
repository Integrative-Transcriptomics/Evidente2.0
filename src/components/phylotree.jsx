import * as d3 from "d3";
import "../../node_modules/phylotree/phylotree";
import * as $ from "jquery";
// import "../../node_modules/jquery-ui-dist/jquery-ui";
// import "../../node_modules/jquery-ui/themes/base/theme.css";
// import "../../node_modules/jquery-ui/themes/base/selectable.css";
// import "../../node_modules/jquery-ui/ui/core";
// import "../../node_modules/jquery-ui/ui/widgets/selectable";
// import * as $ from "jquery-ui";
// import * as popperjs from "@popperjs/core";
// import "../../node_modules/jquery/dist/core";

// import "../../node_modules/@popperjs/core/dist/cjs/popper";

import * as bootbox from "bootbox";
import React, { Component } from "react";
// window.$ = window.jQuery = window.jquery = require("jquery");
// import "../../node_modules/bootstrap/dist/js";

class Phylotree extends Component {
  state = {};
  constructor() {
    super();
  }

  my_collapse(node) {
    node["own-collapse"] = !node["own-collapse"];
    let nameClade = "";
    if (node["own-collapse"]) {
      nameClade = this.props.onCollapse(node);
    } else {
      this.props.onDecollapse(node);
    }
    node["show-name"] = nameClade;
    this.props.tree.toggle_collapse(node).update();
    this.props.onSelection(this.props.tree.get_selection());
    d3.select("#tree-display")
      .call(this.props.onZoom)
      .call(this.props.onZoom.event);
  }

  renameClade(node) {
    bootbox.prompt("Please enter the name of the clade", (name) => {
      name = name.replace(/ /g, "-");
      this.props.onCladeUpdate(node["show-name"], name);
      node["show-name"] = name;
      this.props.tree.update();
      d3.select("#tree-display")
        .call(this.props.onZoom)
        .call(this.props.onZoom.event);
    });
  }
  my_hide(node) {
    if (!node["hidden-t"]) {
      node["hidden-t"] = !node["hidden-t"];
      this.props.tree
        .modify_selection(
          [node].concat(
            this.props.tree.select_all_descendants(node, true, true)
          ),
          "notshown",
          true,
          true,
          "true"
        )
        .update_has_hidden_nodes()
        .update();

      d3.select("#tree-display")
        .call(this.props.onZoom)
        .call(this.props.onZoom.event);
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
      d3.select("#tree-display")
        .call(this.props.onZoom)
        .call(this.props.onZoom.event);
      this.props.onSelection(this.props.tree.get_selection());
    }
  }

  componentDidUpdate(prevProp) {
    if (prevProp.newick === undefined && this.props.newick !== "") {
      this.renderTree(this.props.newick);
    }
    d3.select("#tree-display")
      .call(this.props.onZoom)
      .call(this.props.onZoom.event);
  }
  componentDidMount() {
    this.props.tree
      .size([this.container.offsetHeight, this.container.offsetWidth])
      .svg(d3.select("#tree-display"));
  }

  renderTree(example_tree) {
    this.props.tree(example_tree).style_nodes(this.my_style_nodes).layout();
    this.props.onUploadTree(this.props.tree.get_nodes());
    this.props.tree
      .get_nodes()
      .filter((n) => {
        return !d3.layout.phylotree.is_leafnode(n);
      })
      .forEach((tnode) => {
        d3.layout.phylotree.add_custom_menu(
          tnode,
          (node) => {
            if (node["own-collapse"]) {
              return "Decollapse subtree";
            }
            return "Collapse substree";
          },
          () => {
            this.my_collapse(
              tnode,
              this.props.tree,
              this.props.onZoom,
              this.props.onCollapse
            );
          },
          () => {
            return true;
          }
        );
        d3.layout.phylotree.add_custom_menu(
          tnode, // add to this node
          (node) => {
            return (
              "Hide this " +
              (d3.layout.phylotree.is_leafnode(node) ? "node" : "subtree")
            );
          }, // display this text for the menu
          () => {
            this.my_hide(tnode, this.props.tree, this.props.onZoom);
          },
          // on-click callback include a reference to tree_node via transitive closure
          (node) => {
            return node.name !== "root";
          } // condition on when to display the menu
          // a function that takes node as an argument
        );
        d3.layout.phylotree.add_custom_menu(
          tnode, // add to this node
          (node) => {
            if (node.has_hidden_nodes || false) {
              return "Show the hidden nodes";
            }
          }, // display this text for the menu
          () => {
            this.my_showNodes(tnode);
          },
          // on-click callback include a reference to tree_node via transitive closure
          (node) => {
            return node.has_hidden_nodes || false;
          } // condition on when to display the menu
          // a function that takes node as an argument
        );
        d3.layout.phylotree.add_custom_menu(
          tnode, // add to this node
          (node) => {
            if (node["own-collapse"] || false) {
              return "Rename clade";
            }
          }, // display this text for the menu
          () => {
            this.renameClade(tnode);
          },
          // on-click callback include a reference to tree_node via transitive closure
          (node) => {
            return node["own-collapse"] || false;
          } // condition on when to display the menu
          // a function that takes node as an argument
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
      <div className="lchild" ref={(el) => (this.container = el)}>
        <svg id="tree-display"></svg>{" "}
      </div>
    );
  }
}

export default Phylotree;
