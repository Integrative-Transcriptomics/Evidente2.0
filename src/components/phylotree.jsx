import * as d3 from "d3";
import "../../node_modules/phylotree/src/main";

import * as $ from "jquery";
import * as _ from "lodash";
import React, { Component } from "react";
class Phylotree extends Component {
    state = {};
    did_collapse = false;
    called = false;
    /**
     * For general node styling within the phylogenetic tree
     *
     * @param {HTMLElement} container
     * @param {Object} node
     */
    nodeStyler = (container, node) => {
        this.did_collapse = false;
        let is_leaf = d3.layout.phylotree.is_leafnode(node)
        let is_collapsed = node["own-collapse"]
        let div = d3.select("#tooltip");
        let lookFor = is_collapsed ? node["show-name"] : node.name; // Either clade or leaf
        if (is_leaf || is_collapsed) {
            container
                .selectAll("circle")
                .style({ "fill": "black" }) // Style is covered by index.css
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

            if (is_collapsed) {
                container.selectAll("polygon").remove()
                const numberLeavesShown = (this.props.shownNodes).length
                const sizeTriangle = 12
                const heightTriangle = Math.min(this.container.offsetHeight * 0.95 / numberLeavesShown, sizeTriangle)
                container.insert("polygon", ":first-child").attr({ points: `${sizeTriangle},-${heightTriangle} 1,0 ${sizeTriangle},${heightTriangle}` }).style({ fill: "url(#gradient-collapse)" })
                node["changed-form"] = true
            }
        } else if (node) {
            if (node["changed-form"]) {
                container
                    .selectAll("polygon").remove()
                node["changed-form"] = false
            }

            container
                .selectAll("circle")
                .style("fill", "lightgray")
                .attr({ r: node.has_hidden_nodes ? 4 : 3 })
                .on("mouseout", null)
                .on("mouseover", null);
        }
        if (node["show-snp-table"]) {
            container.selectAll("circle").style({ fill: "lightblue" }).attr({ r: 7 });
        }
        if (node["just-collapsed"]) {
            container.selectAll("circle").style({ fill: "red" }).attr({ r: 6 });
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
            if (node["just-collapsed"]) {
                node["just-collapsed"] = false;
            }
            this.props.onDecollapse(node);
        }
        this.props.onSelection(this.props.tree.get_selection());
    }

    /**
     * Aggregates the selected clade
     * @param {Object} node 
     */
    collNode(node) {
        if (!node["own-collapse"] && !node["hidden"]) {
            node["own-collapse"] = true;
            node["show-name"] = this.props.onCollapse(node);
        }
        this.props.onSelection(this.props.tree.get_selection());
    }

    /**
     * Aggregates all nodes of a list
     * @param {Object} nodeList 
     */
    collapseMultipleNodes(nodeList) {
        nodeList.forEach(function (node) {
            if (!this.props.tree.is_leafnode(node))
                this.collNode(node)
        }, this)
    }
    /**
     * Find the LCA of a list of nodes and aggregate it
     * @param {Object} list_of_nodenames 
     */
    collapse_lca = function (list_of_nodenames) {
        var ancestor = this.props.tree.get_lca(list_of_nodenames);
        if (ancestor !== undefined && !d3.layout.phylotree.is_leafnode(ancestor)) {
            this.collapseNode(ancestor)
            ancestor["just-collapsed"] = true
            this.props.tree.trigger_refresh();
        }
        else {
            alert("Clades can not be collapsed further. You need to select at least two more leafnodes.")
        }

    }

    /**
     * Opens modal for rename of clade
     * @param {Object} node
     */
    renameClade(node) {
        this.props.onOpenRenameClade(node);
    }

    /**
     * Labels each node with the SNP content of all its descendants
     */
    labelNodesWithSNPContent() {
        let nodes = this.props.tree.get_nodes();
        let rootNode = nodes[0];
        let totalNumSupportSNPs = this.getSNPsfromNode(rootNode)[0];

        nodes.forEach((node) => {
            var supportSNPs = this.getSNPsfromNode(node)[0];
            node["percent-support-SNPs"] = (supportSNPs.length / totalNumSupportSNPs.length) * 100;
        })
    }

    /**
     * Gets the SNPs distributed to the selected node.
     * @param {Object} node selected
     */
    getSNPsfromNode(node) {
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
        let uniqNonSupportSNPs = modifyListOfSNPs(notSupportSNPs, [node_name, ...descendants]);
        return [uniqSupportSNPs, uniqNonSupportSNPs]
    }

    /**
     * Shows the SNPs distributed to the selected node.
     * @param {Object} node selected
     */
    showSNPsfromNode(node) {
        this.props.tree.get_nodes().filter(
            node => node["show-snp-table"]).forEach(
                node => node["show-snp-table"] = false)
        node["show-snp-table"] = true;
        let node_name = this.props.ids.numToLabel[node.tempid];
        let listOfSNPs = this.getSNPsfromNode(node);
        let uniqSupportSNPs = listOfSNPs[0]
        let groupedSupport = _.groupBy(uniqSupportSNPs, "inActualNode");
        let uniqNonSupportSNPs = listOfSNPs[1]
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
        this.props.rememberCladeSelection(node, descendants);
    }

    /**
     * Starts statistics dialog to allow user to specify wanted statistical computation. Remebers clade selection for statistical computations for server-request .
     * @param {Object} node selected
     */
    startStatisticsDialog(node) {
        this.props.showStatisticsModal();
        this.remberCladeSelection(node);
    }

    /**
     * starts statistics dialog if statistic files have been uploaded, asks for files otherwise
     *
     */
    isStatisticPossible(node) {
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

    shouldComponentUpdate(nextProp) {

        return (nextProp.newick !== undefined && nextProp.newick !== this.props.newick) ||
            (nextProp.yscale !== undefined && nextProp.yscale !== this.props.yscale) ||
            (nextProp.selectedLeaves !== undefined && nextProp.selectedLeaves !== this.props.selectedLeaves)
    }

    componentDidUpdate(prevProp) {

        d3.selectAll("circle").on("mouseover", (function (d) {
            if (d3.event.shiftKey && !this.props.tree.is_leafnode(d)) {
                document.body.style.cursor = "zoom-in"
            }
        }).bind(this))
            .on("mouseleave", function () { document.body.style.cursor = "default" })
            .on("wheel", this.wheelCollapse.bind(this))

        if (prevProp.newick !== this.props.newick) {
            this.renderTree(this.props.newick);

            //collapse nodes by SNP conten 5 Percent if the tree has more than 150 leaves
            this.labelNodesWithSNPContent();
            if (Object.keys(this.props.tree.get_leaves()).length > 150) {
                var filterNodes = this.props.filterNodesBySNPContent(5);
                document.body.style.cursor = "wait"
                setTimeout(() => {
                    this.collapseMultipleNodes(filterNodes)
                    document.body.style.cursor = "default";
                });
            }

            return
        }
        if (this.props.selectedLeaves.length !== 0 && this.props.selectedLeaves.length !== 1) {
            this.collapse_lca(this.props.selectedLeaves);
            return
        }
    }

    componentDidMount() {
        let margin_top = this.container.offsetHeight * 0.05;
        this.props.initialSizes(margin_top, this.container.offsetHeight);
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
                .attr("horizontal-scale", 1)
                .attr("x-koordinate", 0)
        );

        this.container.addEventListener("mousemove", this.horizontalDrag)
        this.container.addEventListener('wheel', this.horizontalZoom)

        let gradient = d3.select("#tree-display")
            .append("defs")
            .append("linearGradient")
            .attr("id", "gradient-collapse")
        gradient.append("stop")
            .attr({ offset: "0%", "stop-color": "black" })
        gradient.append("stop")
            .attr({ offset: "100%", "stop-color": "white" });
    }

    wheelCollapse = (ev, node) => {
        if (d3.event.shiftKey && !this.props.tree.is_leafnode(node)) {
            if (ev.deltaX > 0 & node["own-collapse"]) {
                this.collapseNode(node)
            }
            else if (ev.deltaX < 0 & !node["own-collapse"]) {
                this.collapseNode(node)
            }

        }
    }

    //Implements horizontal zoom only for the tree component
    horizontalZoom = (ev) => {
        if (ev.ctrlKey) {
            ev.preventDefault()
            var which_function = this.props.tree.spacing_x;
            if (this.props.tree.size()[1] < 400 && ev.deltaY > 0) {
                this.props.tree.size([this.props.tree.size()[0], 331]).update();
                which_function(which_function() - ev.deltaY / 100).update();
            }
            else {
                this.props.tree.size([this.props.tree.size()[0], this.props.tree.size()[1] - ev.deltaY]).update();
                which_function(which_function() - ev.deltaY / 100).update();
            }

        }
        if (ev.shiftKey) {
            d3.selectAll("circle").on("mouseover", (function (d) {
                if (d3.event.shiftKey && !this.props.tree.is_leafnode(d)) {
                    document.body.style.cursor = "zoom-in"
                }
            }).bind(this))
                .on("mouseleave", function () { document.body.style.cursor = "default" })
                .on("wheel", this.wheelCollapse.bind(this, ev))
        }
    }

    //Implements horizontal drag only for the tree component
    horizontalDrag = (ev) => {
        if (this.props.dragActive && ev.ctrlKey) {
            ev.preventDefault()
            let selection = d3.select("#zoom-phylotree")
            let transform = selection.attr("transform") || "translate(0,0)scale(1,1)"
            transform = d3.transform(transform)
            let translateX = transform.translate[0] + ev.movementX
            // let scaleDifference = Math.min(0, this.container.offsetWidth - (this.container.offsetWidth * transform.scale[0]))
            //translateX = Math.max(Math.min(10, translateX), scaleDifference);
            let transformString = `translate(${translateX},${transform.translate[1]})scale(${transform.scale[0]},${transform.scale[1]})`;
            selection.attr(
                "transform",
                `${transformString}`
            );
            selection.attr("x-koordinate", translateX);
        }
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
                tnode, // add to this node
                () => !this.props.cladogramState ? "Show as cladogram" : "Show as dendrogram", // display this text for the menu
                () => this.props.updateCladogramm()
                ,
                (node) => node.depth === 0  // condition on when to display the menu
            );

            d3.layout.phylotree.add_custom_menu(
                tnode, // add to this node
                () => "Collapse nodes by depth ", // display this text for the menu
                () => {
                    this.props.onOpenCollapseModal(tnode);
                }
                ,
                (node) => node.depth === 0  // condition on when to display the menu
            );

            d3.layout.phylotree.add_custom_menu(
                tnode,
                () => "Show SNPs in sidebar",
                () => addTimeoutCursor(() => this.showSNPsfromNode(tnode), 50),
                () => true
            );
            //--------------------------------------------------
            //added to compute clade enrichments
            d3.layout.phylotree.add_custom_menu(
                tnode,
                () => "Compute statistics for clade",
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
                (node) => node.depth !== 0  // condition on when to display the menu
            );

            d3.layout.phylotree.add_custom_menu(
                tnode, // add to this node
                () => "Show the hidden nodes", // display this text for the menu
                () => addTimeoutCursor(() => this.props.onShowMyNodes(tnode)),
                (node) => node.has_hidden_nodes || node.depth === 0 || false
            );
            d3.layout.phylotree.add_custom_menu(
                tnode, // add to this node
                (node) => (node["own-collapse"] || false) && "Rename clade", // display this text for the menu
                () => this.renameClade(tnode),
                (node) => node["own-collapse"] || false
            );
            d3.select("#tree-display").selectAll("polygon").remove()
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