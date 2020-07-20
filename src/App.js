// Own components or files
import Phylotree from "./components/phylotree";
import Heatmap from "./components/heatmap";
import ColorScaleModal from "./components/color-scale-modal";
import OrdinalModal from "./components/modal-ordinal-sort";
import FilterModal from "./components/filter-modal";
import Toolbox from "./components/toolbox";
import Labels from "./components/labels";
import WelcomeModal from "./components/welcome-modal";
import RenameModal from "./components/rename-modal";
import DecideOrdinalModal from "./components/decide-ordinal-modal";
// import { PushSpinner } from "react-spinners-kit";
import LoadingOverlay from "react-loading-overlay";

// Important libraries
import React, { Component } from "react";

import * as d3 from "d3";
import * as $ from "jquery";
import * as _ from "lodash";

import "bootstrap";

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
    if (response.status === 400) {
      console.error(json.message);
      alert("Error by processing files. Please revise the files uploaded. Details in console.");
    } else {
      let { metadataInfo = {} } = json;
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
        newick: json.newick,
        snpdata: { support: json.support, notsupport: json.notSupport },
        availableSNPs: json.availableSNPs,
        ids: json.ids,
        taxamd: json.taxaInfo || [],
        snpmd: json.snpInfo || [],
        mdinfo: metadataInfo,
      });

      $("#welcome-modal-button").text("Run App");
    }
  };
  /**
   * Handles the files being sent to the server.
   * @param {Event} e sent from the file input form.
   */
  handleSubmit = async (e) => {
    this.setState(this.initialState);
    this.handleLoadingToggle(true);
    e.preventDefault();
    const formData = new FormData(document.getElementById("fileform"));
    let response = await fetch(`/api/upload`, {
      method: "post",
      body: formData,
    });

    let json = await response.json();
    if (response.status === 400) {
      console.error(json.message);
      alert("Error by processing files. Please revise the files uploaded. Details in console.");
    } else {
      let { metadataInfo = {} } = json;
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
        snpdata: { support: json.support, notsupport: json.notSupport },
        availableSNPs: json.availableSNPs,
        ids: json.ids,
        taxamd: json.taxaInfo || [],
        snpmd: json.snpInfo || [],
        mdinfo: metadataInfo,
      });
      this.handleLoadingToggle(false);

      $("#metadata-card").click();
    }
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
    this.setState({ loadAnimationShow: show });
  };
  handleMDChange = (ev) => {
    this.setState({
      visualizedMD: ev.map(({ value }) => value),
    });
  };
  updateSNPTable = (nodeID, supportSNPTable, nonSupportSNPTable) => {
    this.setState({
      selectedNodeID: nodeID,
      SNPTable: { support: supportSNPTable, notsupport: nonSupportSNPTable },
    });
  };

  handleSNPChange = (ev) => {
    this.setState({
      visualizedSNPs: ev.map(({ value }) => value),
    });
  };
  handleSNPaddition = (snp) => {
    this.setState({
      visualizedSNPs: _.uniq(this.state.visualizedSNPs.concat([snp])),
    });
  };
  handleMultipleSNPaddition = (listOfSnps) => {
    document.body.style.cursor = "wait !important";
    setTimeout(() => {
      this.setState({
        visualizedSNPs: _.uniq(this.state.visualizedSNPs.concat(listOfSnps)),
      });
      document.body.style.cursor = "";
    }, 5);
  };

  handleChangeOrder = () => {
    this.setState({ ordinalModalShow: true });
  };

  handleDecisionOrdinalCloseModal = (save) => {
    if (!save) {
      this.setState({ decideOrdinalModalShow: false });
    } else {
      this.setState({ ordinalModalShow: true, decideOrdinalModalShow: false });
    }
  };

  handleOrdinalCloseModal = (save, extents) => {
    if (!save) {
      this.setState({ ordinalModalShow: false });
    } else {
      let metadataInfo = this.state.mdinfo;
      for (let [metadataName, newExtent] of extents) {
        metadataInfo[metadataName].extent = newExtent;
      }
      metadataInfo = this.createColorScales(metadataInfo);
      this.setState({ ordinalModalShow: false, mdinfo: metadataInfo, orderChanged: true });
    }
  };
  handleFilterOpenModal = (selectedFeatures = []) => {
    this.setState({ filterModalShow: true, filterFeatures: selectedFeatures });
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
    this.setState({ createdFilters: [], nameOfFilters: [] });
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
    this.setState({ renameModalShow: true, changingCladeNode: node });
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
    this.setState({ colorScaleModalShow: true });
  };
  handleColorScaleCloseModal = (save, extents) => {
    if (!save) {
      this.setState({ colorScaleModalShow: false });
    } else {
      let metadataInfo = this.state.mdinfo;
      let selectedMetadata = _.get(metadataInfo, `${this.chosenMD}`, null);
      if (selectedMetadata) {
        let extent = selectedMetadata.extent;
        let actualType = selectedMetadata.type;
        let colors = extent.map((value, i) => {
          return $(`#colorScale-legendValue-${i}`).attr("fill");
        });

        let colorScale =
          actualType === "numerical"
            ? d3.scale.linear().domain(extent).range(colors)
            : d3.scale.ordinal().domain(extent).range(colors);
        _.set(metadataInfo, `${this.chosenMD}.colorScale`, colorScale);
      }
      this.setState({ colorScaleModalShow: false, mdinfo: metadataInfo });
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

    this.setState({ collapsedClades: jointNodes, cladeNumber: actualNumber + 1 });
    return clade.name;
  };
  handleDecollapse = (cladeNode) => {
    let filteredClades = this.state.collapsedClades.filter((n) => {
      return !Object.is(n.cladeParent, cladeNode);
    });
    this.tree.toggle_collapse(cladeNode).update();
    this.setState({ collapsedClades: filteredClades });
  };

  handleHide = (hideNodes) => {
    let jointNodes = this.state.hiddenNodes.concat(hideNodes);
    this.setState({ hiddenNodes: jointNodes });
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
    let namesShowNodes = showNodes.map(({ name }) => name);
    let filteredNodes = this.state.hiddenNodes.filter((n) => {
      return !namesShowNodes.includes(n.name);
    });
    this.setState({ hiddenNodes: filteredNodes });
  };

  handleSelection = (selection) => {
    let filteredSelection = selection.filter((node) => {
      return (
        (d3.layout.phylotree.is_leafnode(node) || node.collapsed) &&
        d3.layout.phylotree.is_node_visible(node)
      );
    });
    this.setState({ selectedNodes: filteredSelection });
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
      let temp = d3.transform(d3.select(id).attr("transform"));
      $(id).attr(
        "transform",
        `translate(${temp.translate[0]}, ${d3.event.translate[1]} )scale(${d3.event.scale})`
      );
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
                  handleLoadingToggle={this.handleLoadingToggle}
                  showRenameModal={this.state.renameModalShow}
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
                <Heatmap
                  onZoom={this.state.zoom}
                  onDrag={this.lr}
                  divID={"heatmap_viz"}
                  containerID={"heatmap-container"}
                  margin={{ top: 0, right: 20, bottom: 0, left: 5 }}
                  tree={this.tree}
                  nodes={this.state.nodes}
                  hiddenNodes={this.state.hiddenNodes}
                  collapsedClades={this.state.collapsedClades}
                  selectedNodes={this.state.selectedNodes}
                  ids={this.state.ids}
                  visMd={this.state.visualizedMD}
                  visSNPs={this.state.visualizedSNPs}
                  SNPcolorScale={_.get(this.state.mdinfo, "SNP.colorScale", "")}
                  snpdata={this.state.snpdata}
                  isSNP={true}
                />
                <Heatmap
                  onZoom={this.state.zoom}
                  onDrag={this.lr}
                  divID={"md_viz"}
                  containerID={"md-container"}
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                  tree={this.tree}
                  nodes={this.state.nodes}
                  hiddenNodes={this.state.hiddenNodes}
                  collapsedClades={this.state.collapsedClades}
                  selectedNodes={this.state.selectedNodes}
                  ids={this.state.ids}
                  visMd={this.state.visualizedMD}
                  taxadata={this.state.taxamd}
                  mdinfo={this.state.mdinfo}
                  isSNP={false}
                  createdFilters={this.state.createdFilters}
                />
              </div>
              <Toolbox
                onChangeOrder={this.handleChangeOrder}
                onApplyAllFilters={this.handleApplyAllFilter}
                onSNPaddition={this.handleSNPaddition}
                onMultipleSNPaddition={this.handleMultipleSNPaddition}
                onFileUpload={this.handleSubmit}
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
              ></Toolbox>
            </div>
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

            <WelcomeModal id='welcome-modal' />
          </div>
        </LoadingOverlay>
      </React.Fragment>
    );
  }
}

export default App;
