// File: App.js
// Center of Evidente-Frontend
// Component coordianation, interface to Evidente-Backend
// Written by Mathias Witte Paz
// Extended by Sophie Pesch 2021

// Own components or files
import Phylotree from "./components/phylotree";
import ColorScaleModal from "./components/color-scale-modal";
import OrdinalModal from "./components/modal-ordinal-sort";
import FilterModal from "./components/filter-modal";
import Toolbox from "./components/toolbox";
import Labels from "./components/labels";
import WelcomeModal from "./components/welcome-modal";
import RenameModal from "./components/rename-modal";
import DecideOrdinalModal from "./components/decide-ordinal-modal";
import StatisticsModal from "./components/statistics-modal";
import GOModal from "./components/go-modal";
import UploadFilesModal from "./components/upload-files-modal";
import UploadGOFilesModal from "./components/upload-go-files-modal";
import GOResultModal from "./components/go-result-modal";
import TreeResultModal from "./components/tree-result-modal";

//import ResizableModal from "./components/resizable";
// import { PushSpinner } from "react-spinners-kit";
import LoadingOverlay from "react-loading-overlay";

// Important libraries
import React, {Component} from "react";
import * as d3 from "d3";
import * as $ from "jquery";
import * as _ from "lodash";

import "bootstrap";
import HeatmapView from "./components/heatmapView";

class App extends Component {
    state = {};
    lr = d3.behavior.drag().on("drag", this.handleLR);
    chosenMD = "";

    tree = d3.layout
        .phylotree()
        .options({
            brush: false,
            zoom: false,
            "show-scale": false,
            selectable: true,
            collapsible: false,
            hide: false,
            "left-right-spacing": "fit-to-size",
            "top-bottom-spacing": "fit-to-size",
            reroot: false,
            transitions: true,
            "internal-names": true,
            "draw-size-bubbles": true,
        })
        .node_span((d) => 2)
        .branch_name(function () {
            return "";
        });
    zoom = d3.behavior
        .zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 15])
        .on("zoom", this.handleZoom);
    initialState = {
        isLoaded: false,
        zoom: this.zoom,
        // tree: this.tree,
        hiddenNodes: [],
        cladeNumber: 0,
        mdinfo: [],
        availableSNPs: [],
        collapsedClades: [],
        selectedNodes: [],
        visualizedMD: [],
        visualizedSNPs: [],
        SNPTable: {},
        selectedNodeId: null,
        ordinalModalShow: false,
        renameModalShow: false,
        createdFilters: [],
        nameOfFilters: [],
        activeFilters: [],
        orderChanged: false,
        loadAnimationShow: false,
        //-------------------------------------------------
        // added for holding preprocessed statistical data
        // and go-enrichment results:
        snpsToGene: {},
        id_to_go: {},
        go_to_snp_pos: {},
        go_result: [],
        tree_result: {}, //{7:{"subtree":1, "result":[],"subtree_size":5, "num_snps":20, "num_go_terms":200}},//{},
        all_snps: [],
        node_to_snps: {},
        tree_size: 0,
        tree_snps: 0,
        in_gene_tree: 0,
        subtree_size: 0,
        subtree_snps: 0,
        in_gene_clade: 0,
        numOfSigGoTerms: 0,
        statisticsModalShow: false,
        goModalShow: false,
        goResultModalShow: false,
        treeResultModalShow: false,
        uploadFilesModalShow: false,
        uploadGOFilesModalShow: false,
        computeStatistics: false,
        statisticFilesUploaded: false,
        goFilesUploaded: false,
        cladeSelection: [],
        //-------------------------------------------------
    };

    constructor() {
        super();
        this.state = this.initialState;
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleInitTool = async () => {
        let response = await fetch(`/api/init-example`, {
            method: "post",
        });

        let json = await response.json();
        if (response.status === 400 || response.status === 500) {
            console.error(json.message);
            alert("Error by processing files. Please revise the files uploaded. Details in console.");
        } else {
            let {metadataInfo = {}} = json;
            let ordinalValues = _.toPairs(metadataInfo).filter(
                (d) => d[1].type.toLowerCase() === "ordinal"
            );
            if (ordinalValues.length !== 0) {
                this.setState({
                    ordinalValues: ordinalValues.map((d) => [d[0], d[1].extent]),
                });
            }
            metadataInfo = this.createColorScales(metadataInfo);

            this.setState({
                isLoaded: true,
                newick: json.newick,
                snpPerColumn: json.snpPerColumn,
                snpdata: {support: json.support, notsupport: json.notSupport},
                availableSNPs: json.availableSNPs,
                ids: json.ids,
                taxamd: json.taxaInfo || [],
                snpmd: json.snpInfo || [],
                mdinfo: metadataInfo,
                node_to_snps: json.node_to_snps,
                tree_size: json.tree_size,
                tree_snps: json.num_snps,
                all_snps: json.all_snps,
            });

            $("#welcome-modal-button").text("Run App");
        }
    };

    //----------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------
    // All methods in this section have been added in order to process statistical input data,
    // perform an enrichment analysis and visualize the results.

  /**
   *Sort snpdata by node
   **/
  sortSnpData() {
    this.state.snpdata.support.sort((r1, r2) =>
      r1.node > r2.node ? 1 : r1.node < r2.node ? -1 : 0
    );
    this.state.snpdata.notsupport.sort((r1, r2) =>
      r1.node > r2.node ? 1 : r1.node < r2.node ? -1 : 0
    );
    //console.log(this.state.snpdata);
  }

  /**
     *get position of all snps found in leaves in subtree chosen by client
     *sets State variables subtree_snps, subtree_size to
     number of snps and number of nodes
     *returns list of positions
     **/
  getSnpOfSubtree = (node, subtree) => {
    let chosen = [];
    if (!("children" in node)){
      chosen = chosen.concat(this.state.node_to_snps[node.tempid]);
    }
    subtree.forEach((sub_node) => {
      if (!("children" in sub_node)){
      chosen = chosen.concat(this.state.node_to_snps[sub_node.tempid]);
    }});
    this.setState({ subtree_size: subtree.length + 1 });
    this.setState({ subtree_snps: chosen.length });
    return chosen;
  };

  /*
      saves clade selection in state variable, used for result visualization and export
    */
  rememberCladeSelection = (node, descendants) => {
    this.setState({ cladeSelection: [node, descendants] });
  };

  //manage visibility of modals created for statistics-visualization:

  showStatisticsModal = () => {
    this.setState({ statisticsModalShow: true });
  };
  closeStatisticsModal = () => {
    this.setState({ statisticsModalShow: false });
  };
  showGOModal = () => {
    this.setState({ statisticsModalShow: false, goModalShow: true });
  };
  closeGOModal = () => {
    this.setState({ goModalShow: false });
  };
  showGoResultsModal = () => {
    this.setState({ goModalShow: false, goResultModalShow: true });
  };
  showLatestResults = () => {
    this.setState({ goResultModalShow: true });
  };
  showLatestResultsTree = () => {
    this.setState({ treeResultModalShow: true });
  };
  closeGoResultModal = () => {
    this.setState({ goResultModalShow: false });
  };

  allowComputeStatistics = () => {
    this.setState({ computeStatistics: true });
  };
  showUploadFilesModal = () => {
    this.setState({ uploadFilesModalShow: true });
  };

  closeUploadFilesModal = () => {
    $("#statfiles-card").click();
    this.setState({ uploadFilesModalShow: false });
  };
  closeUploadGOFilesModal = () => {
    //$("#statfiles-card").click();
    //$("#statfiles-card").click();
    this.setState({ uploadGOFilesModalShow: false });
  };
  showUploadGOFilesModal = () => {
    this.setState({ uploadGOFilesModalShow: true, statisticsModalShow: false });
  };

  showTreeResultModal = () => {
    this.setState({ treeResultModalShow: true });
  };
  closeTreeResultModal = () => {
    this.setState({ treeResultModalShow: false });
  };

  /**
     * Handles extra files being sent to the server for statistical computation.
     Checks which files have been uploaded and enables statistical computations that are possible now
     Sends additional all snp-positions within the phylogenetic tree as availableSnps
     * @param formData
     */
    handleStatisticSubmit = async (formData) => {
        //var start = performance.now();
        this.setState({computeStatistics: true});
        this.handleLoadingToggle(true);
        //get uploaded files
        //check if at least one file has been uploaded and if so, enable compute-statistics
        if (formData.get("gff") != null || formData.get("goterm") != null) {
            this.setState({statisticFilesUploaded: true});
            //console.log(formData.get("gff"),formData.get("snp_info"), formData.get("goterm"))
            //check if data for go-enrichment has been uploaded and if so enable go enrichment
            if (formData.get("goterm").length !== 0 && formData.get("gff").length !== 0) {
                this.setState({goFilesUploaded: true});
            }
        }
        //add all SNPs available in tree to form data
        var availableSNPs = this.state.availableSNPs.toString();
        formData.set("availabel_snps", availableSNPs);
        //send request at server to preprocess statistic-files
        let response = await fetch(`/api/statistic-upload`, {
            method: "post",
            body: formData,
        });
        let json = await response.json();
        if (response.status === 400 || response.status === 500) {
            //catch server error from prepocessing statistic-files
            console.error(json.message);
            alert("Error by processing files. Please revise the files uploaded. Details in console.");
        } else {
            //var end = performance.now();
            //console.log("statitics-upload: ",(end-start)/1000.0, "seconds");
            //save preprocessed data for go-enrichment for statisticsRequest
            //console.log("received statistics response");
            this.setState({
                snpsToGene: json.snps_to_gene,
                gene_to_go: json.id_to_go,
                go_to_snp_pos: json.go_to_snp_pos,
            });
            //$("#statfiles-card").click();
            //console.log("filled snp-go: ",this.state.snpWithGo)
        }
        this.handleLoadingToggle(false);
    };

    /**
     Sends Clade selection, preprocessed statistical data and ids to backend
     and receives enrichment results
     **/
    sendStatisticsRequest = async (e) => {
        this.handleLoadingToggle(true);
        //console.log("in statistics request");
        //var start = performance.now();
        e.preventDefault();
        let significance_level = document.getElementById("sig-level").value;
        let node = this.state.cladeSelection[0];
        let subtree = this.state.cladeSelection[1];
        //console.log(node,subtree)
        let snp_positions = this.getSnpOfSubtree(node, subtree);
        let data = JSON.stringify({
            all_snps: this.state.all_snps,
            positions: snp_positions,
            snps_to_gene: this.state.snpsToGene,
            gene_to_go: this.state.gene_to_go,
            sig_level: significance_level,
        });
        let response = await fetch("/api/statistics-request", {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: data,
        });
        let json = await response.json();
        if (response.status === 400 || response.status === 500) {
            this.handleLoadingToggle(false);
            alert("Error by compute enrichment. Details in console.");
        } else {
            //var end = performance.now();
            //console.log("statitics-request: ",(end-start)/1000.0, "seconds");
            //console.log("received statistics response");
            this.handleLoadingToggle(false);
            this.setState({
                goModalShow: false,
                goResultModalShow: true,
                go_result: json.go_result,
                numOfSigGoTerms: json.go_result.length,
                in_gene_tree: json.in_gene_tree,
                in_gene_clade: json.in_gene_clade,
            });
        }
    };

    /**
     Sends nwk-tree, preprocessed statistical data, support and number-label-association to backend
     and receives enrichment results
     **/
    sendStatisticsRequestTree = async (e) => {
        //var start = performance.now();
        e.preventDefault();
        let significance_level = document.getElementById("sig-level-tree").value;
        if (!this.state.statisticFilesUploaded || !this.state.goFilesUploaded) {
            this.setState({uploadGOFilesModalShow: true});
            return null;
        } else {
            this.handleLoadingToggle(true);
            let data = JSON.stringify({
                nwk: this.state.newick,
                support: this.state.snpdata.support,
                num_to_label: this.state.ids["numToLabel"],
                snps_to_gene: this.state.snpsToGene,
                node_to_snps: this.state.node_to_snps,
                gene_to_go: this.state.gene_to_go,
                sig_level: significance_level,
                all_snps: this.state.all_snps,
            });
            let response = await fetch("/api/tree-statistics-request", {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: data,
            });
            let json = await response.json();
            if (response.status === 400) {
                console.error(json.message);
                alert("Error by analyzing tree. Details in console.");
            } else {
                this.handleLoadingToggle(false);
                //var end = performance.now();
                //console.log("statitics-tree-request: ",(end-start)/1000.0, "seconds");
                //console.log("received statistics tree response");
                //console.log(json);
                this.setState({
                    tree_result: json.tree_go_result,
                    in_gene_tree: json.in_gene_tree,
                    treeResultModalShow: true,
                });
            }
        }
    };

    //----------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------

    handleSubmitAllFiles = async (files) => {
        this.setState({isLoaded: false})
        const visFormData = new FormData();
        Object.entries(files.visFiles).forEach(([key, value]) => {
            if (value !== null) {
                visFormData.set(key, value)
            }
        })
        await this.handleSubmit(visFormData);
        if (Object.values(files.statisticsFiles).every(file => file !== null)) {
            const statisticsFormData = new FormData();
            Object.entries(files.statisticsFiles).forEach(([key, value]) => {
                if (value !== null) {
                    statisticsFormData.set(key, value)
                }
            })
            await this.handleStatisticSubmit(statisticsFormData);
            this.setState({isLoaded: true})
        } else {
            this.setState({isLoaded: true})
        }
    }
    /**
     * Handles the files being sent to the server.
     * @param formData
     */
    handleSubmit = async (formData) => {
        this.handleLoadingToggle(true);
        let response = await fetch(`/api/upload`, {
            method: "post",
            body: formData,
        });

        let json = await response.json();
        if (response.status === 400 || response.status === 500) {
            console.error(json.message);
            alert("Error by processing files. Please revise the files uploaded. Details in console.");
        } else {
            this.setState(this.initialState);
            // Set file to starting state
            Array.from(document.getElementsByClassName("custom-file-input")).forEach(
                (el) => (el.value = "")
            );
            Array.from(document.getElementsByClassName("custom-file-label")).forEach(
                (el) => (el.innerText = el.innerText.split(":")[0])
            );

            let {metadataInfo = {}} = json;
            let ordinalValues = _.toPairs(metadataInfo).filter(
                (d) => d[1].type.toLowerCase() === "ordinal"
            );
            if (ordinalValues.length !== 0) {
                this.setState({
                    decideOrdinalModalShow: true,
                    ordinalValues: ordinalValues.map((d) => [d[0], d[1].extent]),
                });
            }
            metadataInfo = this.createColorScales(metadataInfo);

            this.setState({
                newick: json.newick,
                snpPerColumn: json.snpPerColumn,
                snpdata: {support: json.support, notsupport: json.notSupport},
                availableSNPs: json.availableSNPs,
                ids: json.ids,
                taxamd: json.taxaInfo || [],
                snpmd: json.snpInfo || [],
                mdinfo: metadataInfo,
                node_to_snps: json.node_to_snps,
                tree_size: json.tree_size,
                tree_snps: json.num_snps,
                all_snps: json.all_snps,
            });
        }
        this.handleLoadingToggle(false);
        this.sortSnpData();
    };

    /**
     * Verifies if the node is a visible End-node
     * @param {Object} node of Phylotree library
     */
    isVisibleEndNode = (node) => {
        return (
            (this.tree.is_leafnode(node) || node["own-collapse"]) &&
            d3.layout.phylotree.is_node_visible(node)
        );
    };

    createColorScales = (metadata) => {
        _.keys(metadata).forEach((k) => {
            let actualType = metadata[k].type.toLowerCase();
            let actualExtent = metadata[k].extent;
            let colorScale;
            switch (actualType) {
                case "numerical":
                    colorScale = d3.scale
                        .linear()
                        .domain(actualExtent)
                        .range(["rgb(250, 240, 240)", "purple"]);
                    break;
                case "categorical":
                    colorScale = d3.scale.category20();
                    break;
                case "ordinal":
                    colorScale = (value) => {
                        let index = actualExtent.indexOf(value);
                        let temp = d3.scale
                            .linear()
                            .domain([0, actualExtent.length - 1])
                            .range([0, 1])(index);
                        return d3.interpolate("rgb(255, 250, 240)", "orange")(temp);
                    };

                    break;
                default:
                    colorScale = d3.scale
                        .ordinal()
                        .domain(["A", "C", "T", "G", "N"])
                        .range(["red", "#E6D700", "blue", "green", "purple"]);
                    break;
            }
            metadata[k].colorScale = colorScale;
        });
        return metadata;
    };

    handleLoadingToggle = (show) => {
        this.setState({loadAnimationShow: show});
    };
    handleMDChange = (ev) => {
        this.setState({
            visualizedMD: ev.map(({value}) => value),
        });
    };
    updateSNPTable = (nodeID, supportSNPTable, nonSupportSNPTable) => {
        this.setState({
            selectedNodeID: nodeID,
            SNPTable: {support: supportSNPTable, notsupport: nonSupportSNPTable},
        });
    };

    handleSNPChange = (ev) => {
        this.setState({
            visualizedSNPs: ev.map(({value}) => value),
        });
    };
    handleSNPaddition = (snp) => {
        this.setState({
            visualizedSNPs: _.uniq(this.state.visualizedSNPs.concat([snp])),
        });
    };
    handleMultipleSNPaddition = (listOfSnps) => {
        // console.log(listOfSnps);
        document.body.style.cursor = "wait !important";
        setTimeout(() => {
            this.setState({
                visualizedSNPs: _.uniq(this.state.visualizedSNPs.concat(listOfSnps)),
            });
            document.body.style.cursor = "";
        }, 5);
    };
    handleHideSNPs = (list_of_snps) => {
        const curr = this.state.visualizedSNPs;
        var next = curr.filter((snp) => !list_of_snps.includes(snp));
        this.setState({visualizedSNPs: next});
    };
    handleChangeOrder = () => {
        this.setState({ordinalModalShow: true});
    };

    handleDecisionOrdinalCloseModal = (save) => {
        if (!save) {
            this.setState({decideOrdinalModalShow: false});
        } else {
            this.setState({ordinalModalShow: true, decideOrdinalModalShow: false});
        }
    };

    handleOrdinalCloseModal = (save, extents) => {
        if (!save) {
            this.setState({ordinalModalShow: false});
        } else {
            let metadataInfo = this.state.mdinfo;
            for (let [metadataName, newExtent] of extents) {
                metadataInfo[metadataName].extent = newExtent;
            }
            metadataInfo = this.createColorScales(metadataInfo);
            this.setState({ordinalModalShow: false, mdinfo: metadataInfo, orderChanged: true});
        }
    };
    handleFilterOpenModal = (selectedFeatures = []) => {
        this.setState({filterModalShow: true, filterFeatures: selectedFeatures});
    };

    handleDeleteFilter = (index) => {
        let modActiveFilters = _.clone(this.state.createdFilters);
        _.remove(modActiveFilters, (n, i) => i === index);
        let modNamefilters = _.clone(this.state.nameOfFilters);
        _.remove(modNamefilters, (n, i) => i === index);

        let taxaDataModified = _.keyBy(this.state.taxamd, "Information");

        let resultingNodes = this.tree
            .get_nodes()
            .filter(this.tree.is_leafnode)
            .filter((node) => {
                let filterResult = this.testForFilters(node, modActiveFilters, taxaDataModified);
                return filterResult;
            });
        this.setState({
            createdFilters: modActiveFilters,
            remainingNodesAfterFilter: resultingNodes.length,
        });
    };
    handleDeleteAllFilters = () => {
        this.handleShowNodes(this.tree.get_nodes()[0]);
        this.setState({createdFilters: [], nameOfFilters: []});
    };
    handleFilterCloseModal = (save, filter, name) => {
        let newFilters = [...this.state.createdFilters, filter];
        let taxaDataModified = _.keyBy(this.state.taxamd, "Information");

        let resultingNodes = this.tree
            .get_nodes()
            .filter(this.tree.is_leafnode)
            .filter((node) => {
                let filterResult = this.testForFilters(node, newFilters, taxaDataModified);
                return filterResult;
            });
        save
            ? this.setState({
                remainingNodesAfterFilter: resultingNodes.length,
                filterModalShow: false,
                createdFilters: newFilters,
                nameOfFilters: [...this.state.nameOfFilters, name],
            })
            : this.setState({
                filterModalShow: false,
            });
    };

    testForFilters(node, filters, data) {
        let nodeName = node.name;
        let processedFilter = filters.map((filter) => {
            let keyValuePair = _.toPairs(filter);
            let resultGroup = keyValuePair.map((el) => {
                let [key, value] = el;
                let typeOfMetadata = this.state.mdinfo[key].type;
                let datum = _.get(data, `[${nodeName}][${key}]`, null);
                switch (typeOfMetadata.toLowerCase()) {
                    case "numerical":
                        return value[0] <= datum && datum <= value[1];

                    default:
                        return value.includes(datum);
                }
            });
            return resultGroup.reduce((acc, now) => acc && now, true);
        });

        return processedFilter.reduce((acc, now) => acc || now, false);
    }

    handleHideMultipleNodes(nodeList) {
        for (let node of nodeList) {
            if (!node["hidden-t"]) {
                node["hidden-t"] = true;
                this.tree.modify_selection([node], "notshown", true, true, "true");
            }
        }
        this.handleHide(nodeList);
        this.tree.update_has_hidden_nodes().update();

        d3.select("#tree-display").call(this.state.zoom).call(this.state.zoom.event);
        this.handleSelection(this.tree.get_selection());
    }

    tempShowNodes(node) {
        let nodes = [node].concat(this.tree.select_all_descendants(node, true, true));
        this.tree.modify_selection(nodes, "hidden-t", true, true, "false");
        this.tree.modify_selection(nodes, "notshown", true, true, "false");
        this.handleShowOnHeatmap(this.tree.descendants(node));
    }

    handleApplyAllFilter = () => {
        let root = this.tree.get_nodes()[0];
        this.tempShowNodes(root);
        let taxaDataModified = _.keyBy(this.state.taxamd, "Information");
        let resultingNodes = this.tree
            .get_nodes()
            .filter(this.tree.is_leafnode)
            .filter((node) => {
                let filterResult = this.testForFilters(node, this.state.createdFilters, taxaDataModified);
                return !filterResult;
            });
        this.handleHideMultipleNodes(resultingNodes);
    };

    handleRenameOpenModal = (node) => {
        this.setState({renameModalShow: true, changingCladeNode: node});
    };
    handleRenameCloseModal = (save, node, name) => {
        name = name.replace(/[^a-zA-Z0-9_-]/g, "_");
        let given_names = this.tree
            .get_nodes()
            .filter((n) => d3.layout.phylotree.is_leafnode(n) || node.collapsed)
            .map((leaf) => (leaf.collapsed ? leaf["show-name"] : leaf["name"]));

        if (!save) {
            this.setState({
                renameModalShow: false,
            });
        } else if (given_names.includes(name)) {
            alert("This name is already given. Try another name.");
        } else {
            let oldName = node["show-name"];
            let newName = name;
            node["show-name"] = newName;

            $(`.guides.node-${oldName}`).removeClass(`node-${oldName}`).addClass(`node-${newName}`);
            let clades = this.state.collapsedClades;
            let renamedClade = clades.find((x) => x.showname === oldName);
            renamedClade.showname = newName;

            let jointNodes = [
                ...this.state.collapsedClades.filter((x) => x.showname !== oldName),
                renamedClade,
            ];
            this.tree.update();
            this.handleSelection(this.tree.get_selection());
            this.setState({
                collapsedClades: jointNodes,
                renameModalShow: false,
            });
            d3.select("#tree-display").call(this.state.zoom).call(this.state.zoom);
        }
    };
    handleColorChange = (metadataName) => {
        this.chosenMD = metadataName;
        this.setState({colorScaleModalShow: true});
    };
    handleColorScaleCloseModal = (save, newExtent, newColors) => {
        if (!save) {
            this.setState({colorScaleModalShow: false});
        } else {
            let metadataInfo = this.state.mdinfo;
            let selectedMetadata = _.get(metadataInfo, `${this.chosenMD}`, null);
            if (selectedMetadata) {
                let actualType = selectedMetadata.type;
                let colorScale =
                    actualType === "numerical"
                        ? d3.scale.linear().domain(newExtent).range(newColors)
                        : d3.scale.ordinal().domain(newExtent).range(newColors);
                _.set(metadataInfo, `${this.chosenMD}.colorScale`, colorScale);
                _.set(metadataInfo, `${this.chosenMD}.extent`, newExtent);

            }
            this.setState({colorScaleModalShow: false, mdinfo: metadataInfo});
        }
    };
    handleUploadTree = (nodes) => {
        this.setState({
            nodes: nodes,
        });
    };
    handleCollapse = (cladeNode) => {
        let collapsedNodes = this.tree.descendants(cladeNode).filter(d3.layout.phylotree.is_leafnode);

        let clade = {
            name: "Clade_" + this.state.cladeNumber,
            showname: "Clade_" + this.state.cladeNumber,
            cladeParent: cladeNode,
            cladeLeaves: collapsedNodes,
        };
        cladeNode.name = clade.name;

        cladeNode["show-name"] = clade.name;
        let actualNumber = this.state.cladeNumber;
        let jointNodes = this.state.collapsedClades.concat([clade]);
        this.tree.toggle_collapse(cladeNode).update();

        this.setState({collapsedClades: jointNodes, cladeNumber: actualNumber + 1});
        return clade.name;
    };
    handleDecollapse = (cladeNode) => {
        let filteredClades = this.state.collapsedClades.filter((n) => {
            return !Object.is(n.cladeParent, cladeNode);
        });
        this.tree.toggle_collapse(cladeNode).update();
        this.setState({collapsedClades: filteredClades});
    };

    handleHide = (hideNodes) => {
        let jointNodes = this.state.hiddenNodes.concat(hideNodes);
        this.setState({hiddenNodes: jointNodes});
    };

    handleShowNodes = (node) => {
        let nodes = [node].concat(this.tree.select_all_descendants(node, true, true));
        this.tree.modify_selection(nodes, "hidden-t", true, true, "false");
        this.tree.modify_selection(nodes, "notshown", true, true, "false");
        this.tree.update_has_hidden_nodes().update();
        this.handleShowOnHeatmap(this.tree.descendants(node));
        d3.select("#tree-display").call(this.state.zoom).call(this.state.zoom.event);
        this.handleSelection(this.tree.get_selection());
    };
    handleShowOnHeatmap = (showNodes) => {
        let namesShowNodes = showNodes.map(({name}) => name);
        let filteredNodes = this.state.hiddenNodes.filter((n) => {
            return !namesShowNodes.includes(n.name);
        });
        this.setState({hiddenNodes: filteredNodes});
    };

    handleSelection = (selection) => {
        let filteredSelection = selection.filter((node) => {
            return (
                (d3.layout.phylotree.is_leafnode(node) || node.collapsed) &&
                d3.layout.phylotree.is_node_visible(node)
            );
        });
        this.setState({selectedNodes: filteredSelection});
    };

    componentDidMount() {
        d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .attr("id", "tooltip")
            .style("display", "none");

        this.handleInitTool();
    }

    handleZoom() {
        for (let id of [
            "#heatmap-container",
            "#md-container",
            "#zoom-phylotree",
            "#container-labels",
        ]) {
            const selection = d3.select(id);
            if (!selection.empty()) {
                const temp = d3.transform(selection.attr("transform"));
                $(id).attr(
                    "transform",
                    `translate(${temp.translate[0]}, ${d3.event.translate[1]} )scale(${d3.event.scale})`
                );
            }
        }
    }

    handleLR() {
        let translate = {
            "tree-display": "#zoom-phylotree",
            display_heatmap_viz: "#heatmap-container",
            display_md_viz: "#md-container",
            display_labels_viz: "#container-labels",
        };
        let container = $(translate[this.id]);
        let t = d3.transform(container.attr("transform"));
        container.attr(
            "transform",
            `translate( ${Math.max(
                Math.min(
                    t.translate[0] + d3.event.dx,
                    t.scale[0] * this.getBoundingClientRect().width * 0.95
                ),
                -t.scale[0] * this.getBoundingClientRect().width * 0.95
            )}, ${t.translate[1]})scale(${t.scale})`
        );
    }

    render() {
        let shownNodes = this.tree
            .get_nodes()
            .filter((node) => this.isVisibleEndNode(node))
            .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));
        return (
            <React.Fragment>
                <LoadingOverlay active={this.state.loadAnimationShow} spinner text='Loading...'>
                    <div id='outer'>
                        <header id='inner_fixed'>Evidente</header>

                        <div id='div-container-all' className='parent-div'>
                            <div id='parent-svg' className='parent-svgs'>
                                <Phylotree
                                    sendStatisticsRequest={this.sendStatisticsRequest}
                                    handleLoadingToggle={this.handleLoadingToggle}
                                    showRenameModal={this.state.renameModalShow}
                                    allowComputeStatistics={this.allowComputeStatistics}
                                    computeStatistics={this.state.computeStatistics}
                                    showStatisticsModal={this.showStatisticsModal}
                                    rememberCladeSelection={this.rememberCladeSelection}
                                    showUploadFilesModal={this.showUploadFilesModal}
                                    selectedNodeID={this.state.selectedNodeID}
                                    updateSNPTable={this.updateSNPTable}
                                    tree={this.tree}
                                    onShowMyNodes={this.handleShowNodes}
                                    onZoom={this.state.zoom}
                                    onDrag={this.lr}
                                    onCollapse={this.handleCollapse}
                                    onDecollapse={this.handleDecollapse}
                                    onUploadTree={this.handleUploadTree}
                                    onHide={this.handleHide}
                                    onSelection={this.handleSelection}
                                    onOpenRenameClade={this.handleRenameOpenModal}
                                    newick={this.state.newick}
                                    snpdata={this.state.snpdata}
                                    ids={this.state.ids}
                                    dialog={this.dialog}
                                />

                                <Labels
                                    divID={"labels_viz"}
                                    shownNodes={shownNodes}
                                    onZoom={this.state.zoom}
                                    onDrag={this.lr}
                                />
                                <div className="mchild">
                                    {this.state.isLoaded ?
                                        <HeatmapView
                                            onZoom={this.state.zoom}
                                            onDrag={this.lr}
                                            divID={"md_viz"}
                                            containerID={"md-container"}
                                            nodes={this.state.nodes}
                                            hiddenNodes={this.state.hiddenNodes}
                                            selectedNodes={this.state.selectedNodes}
                                            createdFilters={this.state.createdFilters}
                                            tree={this.tree}
                                            snpdata={this.state.snpdata}
                                            snpPerColumn={this.state.snpPerColumn}
                                            visSNPs={this.state.visualizedSNPs}
                                            visualizedMD={this.state.visualizedMD}
                                            collapsedClades={this.state.collapsedClades}
                                            ids={this.state.ids}
                                            taxadata={this.state.taxamd}
                                            mdinfo={this.state.mdinfo}
                                            margin={{top: 0, right: 20, bottom: 0, left: 0}}
                                            SNPcolorScale={_.get(this.state.mdinfo, "SNP.colorScale", "")}

                                        /> : null}
                                </div>
                            </div>

                            <Toolbox
                                loadFiles={this.handleSubmitAllFiles}
                                onChangeOrder={this.handleChangeOrder}
                                onApplyAllFilters={this.handleApplyAllFilter}
                                onSNPaddition={this.handleSNPaddition}
                                onMultipleSNPaddition={this.handleMultipleSNPaddition}
                                onStatisticsTreeRequest={this.sendStatisticsRequestTree}
                                showLatestResults={this.showLatestResults}
                                showLatestResultsTree={this.showLatestResultsTree}
                                onMDChange={this.handleMDChange}
                                onSNPChange={this.handleSNPChange}
                                onColorChange={this.handleColorChange}
                                onOpenFilter={this.handleFilterOpenModal}
                                SNPTable={this.state.SNPTable}
                                availableMDs={this.state.mdinfo}
                                availableSNPs={this.state.availableSNPs}
                                visMd={this.state.visualizedMD}
                                orderChanged={this.state.orderChanged}
                                visSNPs={this.state.visualizedSNPs}
                                remainingNodes={this.state.remainingNodesAfterFilter}
                                createdFilters={this.state.createdFilters}
                                nameOfFilters={this.state.nameOfFilters}
                                onDeleteFilter={this.handleDeleteFilter}
                                onDeleteAllFilters={this.handleDeleteAllFilters}
                                handleLoadingToggle={this.handleLoadingToggle}
                            />
                        </div>
                        {this.state.statisticsModalShow && (
                            <StatisticsModal
                                id='statistics-modal'
                                show={this.state.statisticsModalShow}
                                goFilesUploaded={this.state.goFilesUploaded}
                                showGOModal={this.showGOModal}
                                showUploadGOFilesModal={this.showUploadGOFilesModal}
                                handleClose={this.closeStatisticsModal}
                            />
                        )}
                        {this.state.goModalShow && (
                            <GOModal
                                id='go-modal'
                                show={this.state.goModalShow}
                                showGOModal={this.showGOModal}
                                handleClose={this.closeGOModal}
                                testGO={this.testGO}
                                sendStatisticsRequest={this.sendStatisticsRequest}
                            />
                        )}
                        {this.state.uploadFilesModalShow && (
                            <UploadFilesModal
                                id='upload-files-modal'
                                show={this.state.uploadFilesModalShow}
                                handleClose={this.closeUploadFilesModal}
                            />
                        )}
                        {this.state.uploadGOFilesModalShow && (
                            <UploadGOFilesModal
                                id='upload-files-modal'
                                show={this.state.uploadGOFilesModalShow}
                                handleClose={this.closeUploadGOFilesModal}
                            />
                        )}
                        {this.state.goResultModalShow && (
                            <GOResultModal
                                id='go-result-modal'
                                show={this.state.goResultModalShow}
                                handleClose={this.closeGoResultModal}
                                numOfSigGoTerms={this.state.numOfSigGoTerms}
                                go_result={this.state.go_result}
                                tree_size={this.state.tree_size}
                                tree_snps={this.state.tree_snps}
                                in_gene_tree={this.state.in_gene_tree}
                                subtree_size={this.state.subtree_size}
                                subtree_snps={this.state.subtree_snps}
                                in_gene_clade={this.state.in_gene_clade}
                                go_to_snps={this.state.go_to_snp_pos}
                                handleMultipleSNPadditon={this.handleMultipleSNPaddition}
                                visualizedSNPs={this.state.visualizedSNPs}
                                handleHideSNPs={this.handleHideSNPs}
                                tree={this.tree}
                                clade={this.state.cladeSelection}
                                root={this.state.cladeSelection[0]}
                            />
                        )}
                        {this.state.treeResultModalShow && (
                            <TreeResultModal
                                show={this.state.treeResultModalShow}
                                tree_result={this.state.tree_result}
                                handleClose={this.closeTreeResultModal}
                                handleShow={this.showTreeResultModal}
                                tree_size={this.state.tree_size}
                                tree_snps={this.state.tree_snps}
                                in_gene_tree={this.state.in_gene_tree}
                                go_to_snps={this.state.go_to_snp_pos}
                                handleMultipleSNPadditon={this.handleMultipleSNPaddition}
                                visualizedSNPs={this.state.visualizedSNPs}
                                handleHideSNPs={this.handleHideSNPs}
                                tree={this.tree}
                            />
                        )}
                        {this.state.ordinalModalShow && (
                            <OrdinalModal
                                id='ordinal-modal'
                                show={this.state.ordinalModalShow}
                                ordinalValues={this.state.ordinalValues}
                                handleClose={this.handleOrdinalCloseModal}
                            />
                        )}
                        {this.state.colorScaleModalShow && (
                            <ColorScaleModal
                                id='color-scale-modal'
                                mdinfo={this.state.mdinfo}
                                chosenMD={this.chosenMD}
                                show={this.state.colorScaleModalShow}
                                handleClose={this.handleColorScaleCloseModal}
                            />
                        )}
                        {this.state.filterModalShow && (
                            <FilterModal
                                id='filter-modal'
                                mdinfo={this.state.mdinfo}
                                show={this.state.filterModalShow}
                                filterFeatures={this.state.filterFeatures}
                                handleClose={this.handleFilterCloseModal}
                            />
                        )}
                        {this.state.renameModalShow && (
                            <RenameModal
                                id='rename-modal'
                                show={this.state.renameModalShow}
                                changingCladeNode={this.state.changingCladeNode}
                                name={this.state.changingCladeNode["show-name"]}
                                handleClose={this.handleRenameCloseModal}
                            />
                        )}
                        {this.state.decideOrdinalModalShow && (
                            <DecideOrdinalModal
                                id='decide-ordinal-modal'
                                show={this.state.decideOrdinalModalShow}
                                handleClose={this.handleDecisionOrdinalCloseModal}
                            />
                        )}
                        <WelcomeModal id='welcome-modal'/>
                    </div>
                </LoadingOverlay>
            </React.Fragment>
        );
    }
}

export default App;
