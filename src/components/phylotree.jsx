import * as d3 from "d3";
import * as d3v5 from "d3v5";
import "../../node_modules/phylotree/src/main";

import * as $ from "jquery";
import * as _ from "lodash";
import React, { Component } from "react";

class Phylotree extends Component {
    state = {};

    /**
     * For general node styling within the phylogenetic tree
     *
     * @param {HTMLElement} container
     * @param {Object} node
     */
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
            container.selectAll("circle").style({ fill: "lightblue" }).attr({ r: 7 });
        }
    };

    /**
     * Aggregates the selected clade
     * @param {Object} node
     */
    collapseNode(node) {
        if (!node["own-collapse"]) {
            node["own-collapse"] = true;
            node["show-name"] = this.props.onCollapse(node);
        } else {
            node["show-name"] = "";
            node["own-collapse"] = false;
            this.props.onDecollapse(node);
        }
        this.props.onSelection(this.props.tree.get_selection());
    }

    /**
     * Opens modal for rename of clade
     * @param {Object} node
     */
    renameClade(node) {
        this.props.onOpenRenameClade(node);
    }

    /**
     * Shows the SNPs distributed to the selected node.
     * @param {Object} node selected
     */
    showSNPsfromNode(node) {
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
                    .map((snp) => ({
                        pos: snp.pos,
                        allele: snp.allele,
                        inActualNode: snp.node === listNames[0],
                    }))
                    .sort((a, b) => d3.ascending(parseInt(a.pos), parseInt(b.pos))),
                _.isEqual
            );
        let uniqSupportSNPs = modifyListOfSNPs(supportSNPs, [node_name, ...descendants]);
        let groupedSupport = _.groupBy(uniqSupportSNPs, "inActualNode");
        let uniqNonSupportSNPs = modifyListOfSNPs(notSupportSNPs, [node_name, ...descendants]);
        let groupedNonSupport = _.groupBy(uniqNonSupportSNPs, "inActualNode");
        let supportSNPTable = {
            actualNode: groupedSupport.true,
            descendants: groupedSupport.false,
        };

        let nonSupportSNPTable = {
            actualNode: groupedNonSupport.true,
            descendants: groupedNonSupport.false,
        };

        this.props.updateSNPTable(node_name, supportSNPTable, nonSupportSNPTable);
        this.props.tree.trigger_refresh();

        if (uniqSupportSNPs.length === 0 && uniqNonSupportSNPs.length === 0) {
            alert("This node contains no SNP. Please select another node.");
        } else if (uniqSupportSNPs.length > 0) {
            if (!$("#supportingSNPs-card").hasClass("show")) {
                $("#supportingSNPs-header").click();
            }
        } else {
            if (!$("#nonSupportingSNPs-card").hasClass("show")) {
                $("#nonSupportingSNPs-header").click();
            }
        }
    }

    //---------------------------------------------------------


    /** Get clade selection and remember for statistial computation.
     *
     */
    remberCladeSelection(node) {
        //let node_name =    this.props.ids.numToLabel[node.tempid];
        let descendants = this.props.tree
            .descendants(node)
            .filter((d) => d.tempid !== node.tempid)
        //.map((d) => this.props.ids.numToLabel[d.tempid]);
        //console.log("phlyo-desc", descendants);
        this.props.rememberCladeSelection(node, descendants);
    }

    /**
     * Starts statistics dialog to allow user to specify wanted statistical computation. Remebers clade selection for statistical computations for server-request .
     * @param {Object} node selected
     */
    startStatisticsDialog(node) {
        //console.log("in statistics dialog");
        //console.log("dialog should be visible");
        this.props.showStatisticsModal();
        this.remberCladeSelection(node);
    }

    /**
     * starts statistics dialog if statistic files have been uploaded, asks for files otherwise
     *
     */
    isStatisticPossible(node) {
        console.log("node?", node);
        if (this.props.computeStatistics) {
            this.startStatisticsDialog(node)
        } else {
            this.props.showUploadFilesModal();
        }
    }

    //-----------------------------------------------------------

    /**
     * Hides selected node and its descendants
     * @param {Object} node
     */
    hideNode(node) {
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

            this.props.onHide(this.props.tree.descendants(node));
            this.props.onSelection(this.props.tree.get_selection());
        }
    }

    shouldComponentUpdate(nextProp, nextState) {

        return (nextProp.newick !== undefined && nextProp.newick !== this.props.newick)
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
                .append("g")
                .attr("id", "zoom-phylotree")
        );




        const zoomHorizontal = (startx, starty, w, h) => d3v5.zoom().filter(function () {
            return d3v5.event.shiftKey;
        }).scaleExtent([1, 10]).translateExtent([
            [startx, starty],
            [w, h]
        ]).on("zoom", (d, event, i) => {
            const zoomState = d3v5.zoomTransform(d3v5.select(`#tree-display`).node());
            const verticalZoom = d3v5.zoomTransform(d3v5.select("#parent-svg").node());
            const selection = d3.select(`#zoom-phylotree`);
            selection.attr(
                "transform",
                `translate(${zoomState.x}, ${verticalZoom.y} )scale(${zoomState.k}, ${verticalZoom.k})`
            );

        });

        d3v5.select(`#tree-display`).call(zoomHorizontal(0, 0, this.container.offsetWidth, this.container.offsetHeight));


    }

    /**
     * Start the rendering of the newick tree.
     * It includes the interactions also.
     *
     * @param {String} input_tree
     */
    renderTree(input_tree) {
        const addTimeoutCursor = (func, time = 10) => {
            document.body.style.cursor = "wait";
            window.setTimeout(() => {
                func();
                document.body.style.cursor = "default";
            }, time);
        };

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
                () => addTimeoutCursor(() => this.showSNPsfromNode(tnode), 50),
                () => true
            );
            //--------------------------------------------------
            //added to compute clade enrichments
            d3.layout.phylotree.add_custom_menu(
                tnode,
                () => "Compute statistics for subtree",
                () => addTimeoutCursor(() => this.isStatisticPossible(tnode), 1),
                () => true
            );
            //---------------------------------------------------


            d3.layout.phylotree.add_custom_menu(
                tnode,
                (node) => (node["own-collapse"] ? "Decollapse subtree" : "Collapse substree"),
                () =>
                    addTimeoutCursor(
                        () =>
                            this.collapseNode(tnode, this.props.tree, this.props.onCollapse),
                        1
                    ),

                () => !d3.layout.phylotree.is_leafnode(tnode)
            );
            d3.layout.phylotree.add_custom_menu(
                tnode, // add to this node
                (node) => "Hide this " + (d3.layout.phylotree.is_leafnode(node) ? "node" : "subtree"), // display this text for the menu
                () => addTimeoutCursor(() => this.hideNode(tnode, this.props.tree,)),
                (node) => node.name !== "root" // condition on when to display the menu
            );
            d3.layout.phylotree.add_custom_menu(
                tnode, // add to this node
                () => "Show the hidden nodes", // display this text for the menu
                () => addTimeoutCursor(() => this.props.onShowMyNodes(tnode)),
                (node) => node.has_hidden_nodes || node.name === "root" || false
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

    /**
     * Updates after each selection the corresponding views
     */
    runSelection = () => {
        this.props.tree.selection_callback((selection) => {
            this.props.onSelection(selection);
        });
    };

    render() {
        return <div className='lchild' ref={(el) => (this.container = el)} />;
    }
}

export default Phylotree;
