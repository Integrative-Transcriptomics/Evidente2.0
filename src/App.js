// import logo from "./logo.svg";
import "./App.css";
import Phylotree from "./components/phylotree";
import Heatmap from "./components/heatmap";
import * as d3 from "d3";
import * as d3v5 from "d3v5";
import getValue from "react-select";

// import SNPTable from "./components/table";
import ColorScaleModal from "./components/color-scale-modal";
import OrdinalModal from "./components/modal-ordinal-sort";
import FilterModal from "./components/filter-modal";

import * as $ from "jquery";
// import { observable } from "mobx";
import "../node_modules/jquery/dist/jquery";
import "../node_modules/bootstrap/dist/js/bootstrap";
import React, { Component } from "react";
import Toolbox from "./components/toolbox";
import * as _ from "lodash";
import bootbox from "bootbox";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import { color } from "d3";

class App extends Component {
  state = {};
  lr = d3.behavior.drag().on("drag", this.handleLR);
  color_cat = [
    "#8dd3c7",
    "#ffffb3",
    "#bebada",
    "#fb8072",
    "#80b1d3",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#d9d9d9",
    "#bc80bd",
    "#ccebc5",
    "#ffed6f",
  ];
  color_cat = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
    "#cab2d6",
    "#6a3d9a",
    "#ffff99",
    "#b15928",
  ];
  chosenMD = "";
  constructor() {
    super();
    let tree = d3.layout
      .phylotree()
      .options({
        brush: false,
        zoom: true,
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
        // "align-tips": true,
      })
      .node_span((d) => 2)
      .branch_name(function () {
        return "";
      });
    // .style_nodes(this.nodeStyler)
    // tree.branch_length(() => 2);
    const zoom = d3.behavior
      .zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 15])
      .on("zoom", this.handleZoom);

    let cladeNumber = 0;
    let collapsedClades = [];
    this.state = {
      zoom: zoom,
      tree: tree,
      hiddenNodes: [],
      cladeNumber: cladeNumber,
      collapsedClades: collapsedClades,
      selectedNodes: [],
      visualizedMD: [],
      visualizedSNPs: [],
      SNPTable: {},
      ordinalModalShow: false,
      createdFilters: [],
      activeFilters: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById("fileform"));
    let response = await fetch(`/api/upload`, {
      method: "post",
      body: formData,
    });

    let json = await response.json();

    let metadataInfo = json.metadataInfo || {};
    let ordinalValues = _.toPairs(metadataInfo).filter(
      (d) => d[1].type.toLowerCase() === "ordinal"
    );
    if (ordinalValues.length !== 0) {
      this.setState({
        ordinalModalShow: true,
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
    $("#metadata-card").click();
  };

  updateSNPTable = (supportSNPTable, nonSupportSNPTable) => {
    this.setState({ SNPTable: { support: supportSNPTable, notsupport: nonSupportSNPTable } });
  };

  createColorScales = (metadata) => {
    _.keys(metadata).forEach((k) => {
      let actualType = metadata[k].type.toLowerCase();
      let actualExtent = metadata[k].extent;
      let colorScale =
        actualType === "numerical"
          ? d3.scale.linear().domain(actualExtent).range(["blue", "red"])
          : ["categorical", "ordinal"].includes(actualType)
          ? d3.scale.ordinal().domain(actualExtent).range(this.color_cat)
          : d3.scale
              .ordinal()
              .domain(["A", "C", "T", "G", "N"])
              .range(["red", "#E6D700", "blue", "green", "purple"]);
      metadata[k].colorScale = colorScale;
    });
    return metadata;
  };

  handleColorChange = (metadataName) => {
    this.chosenMD = metadataName;
    this.setState({ colorScaleModalShow: true });
  };
  handleMDChange = (ev) => {
    this.setState({
      visualizedMD: (ev || []).map(({ value }) => value),
    });
  };
  handleSNPChange = (ev) => {
    this.setState({
      visualizedSNPs: (ev || []).map(({ value }) => value),
    });
  };
  handleSNPaddition = (snp) => {
    this.setState({
      visualizedSNPs: _.uniq(this.state.visualizedSNPs.concat([snp])),
    });
  };

  handleCladeCreation = () => {
    let actualNumber = this.state.cladeNumber;
    this.setState({ cladeNumber: actualNumber + 1 });
  };

  handleCollapse = (cladeNode) => {
    let collapsedNodes = this.state.tree
      .descendants(cladeNode)
      .filter(d3.layout.phylotree.is_leafnode);

    let clade = {
      name: "Clade_" + this.state.cladeNumber,
      showname: "Clade_" + this.state.cladeNumber,
      cladeParent: cladeNode,
      cladeLeaves: collapsedNodes,
    };
    cladeNode.name = clade.name;

    cladeNode["show-name"] = clade.name;
    this.handleCladeCreation();
    let jointNodes = this.state.collapsedClades.concat([clade]);
    this.state.tree.toggle_collapse(cladeNode).update();

    this.setState({ collapsedClades: jointNodes });
    return clade.name;
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
      this.setState({ ordinalModalShow: false, mdinfo: metadataInfo });
    }
  };
  handleFilterOpenModal = (selectedFeatures) => {
    this.setState({ filterModalShow: true, filterFeatures: selectedFeatures });
  };
  handleApplyAllFilter = () => {
    // this.my_showNodes(this.state.tree.get_nodes().filter((n) => n.name === "root")[0]);
    this.setState({ activeFilters: this.state.createdFilters });
    // this.state.tree.update();
  };
  handleDeleteFilter = (index) => {
    // this.my_showNodes(this.state.tree.get_nodes().filter((n) => n.name === "root")[0]);
    let modActiveFilters = _.clone(this.state.createdFilters);
    let tmp = _.remove(modActiveFilters, (n, i) => i === index);
    this.setState({ createdFilters: modActiveFilters });
    // this.state.tree.update();
  };
  handleDeleteAllFilters = () => {
    this.my_showNodes(this.state.tree.get_nodes().filter((n) => n.name === "root")[0]);
    this.setState({ createdFilters: [] });
    // this.state.tree.update();
  };
  handleFilterCloseModal = (save, filter) => {
    save
      ? this.setState({
          filterModalShow: false,
          createdFilters: [...this.state.createdFilters, filter],
        })
      : this.setState({
          filterModalShow: false,
        });
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
  handleCladeUpdate = (oldName, newName) => {
    $(`.guides.${oldName}`).removeClass(oldName).addClass(newName);
    let clades = this.state.collapsedClades;
    let renamedClade = clades.find((x) => x.showname === oldName);
    renamedClade.showname = newName;

    let jointNodes = [
      ...this.state.collapsedClades.filter((x) => x.showname !== oldName),
      renamedClade,
    ];
    this.setState({ collapsedClades: jointNodes });
  };

  handleDecollapse = (cladeNode) => {
    this.state.tree.toggle_collapse(cladeNode).update();
    let filteredClades = this.state.collapsedClades.filter((n) => {
      return !Object.is(n.cladeParent, cladeNode);
    });
    this.setState({ collapsedClades: filteredClades });
  };

  handleHide = (hideNodes) => {
    let jointNodes = this.state.hiddenNodes.concat(hideNodes);
    this.setState({ hiddenNodes: jointNodes });
  };
  handleUploadTree = (nodes) => {
    this.setState({
      nodes: nodes,
    });
  };
  my_showNodes = (node) => {
    this.state.tree.modify_selection(
      this.state.tree.select_all_descendants(node, true, true),
      "hidden-t",
      true,
      true,
      "false"
    );
    this.state.tree
      .modify_selection(
        this.state.tree.select_all_descendants(node, true, true),
        "notshown",
        true,
        true,
        "false"
      )
      .update_has_hidden_nodes()
      .update();
    this.handleShow(this.state.tree.descendants(node));
    d3.select("#tree-display").call(this.state.zoom).call(this.state.zoom.event);
    this.handleSelection(this.state.tree.get_selection());
  };
  handleShow = (showNodes) => {
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
    let zoom = this.state.zoom;
    // Adds zoom on both
    for (let container of ["#tree-display", "#display_heatmap_viz", "#display_md_viz"]) {
      // for (let container of ["#tree-display", "#display_heatmap_viz"]) {
      d3.select(container).call(zoom).call(this.lr);
    }
    d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "tooltip")
      .style("display", "none");
  }

  handleZoom() {
    for (let id of ["#heatmap-container", "#md-container", ".phylotree-container"]) {
      // for (let id of ["#heatmap-container", ".phylotree-container"]) {
      let temp = d3.transform(d3.select(id).attr("transform"));
      $(id).attr(
        "transform",
        `translate(${temp.translate[0]}, ${d3.event.translate[1]} )scale(${d3.event.scale})`
      );
    }
  }

  handleLR() {
    let translate = {
      "tree-display": ".phylotree-container",
      display_heatmap_viz: "#heatmap-container",
      display_md_viz: "#md-container",
    };
    let container = $(translate[this.id]);
    // this.id === "tree-display" ? $(".phylotree-container") : $("#heatmap-container");
    let t = d3.transform(container.attr("transform"));
    container.attr(
      "transform",
      `translate( ${t.translate[0] + d3.event.dx}, ${t.translate[1]})scale(${t.scale})`
    );
  }

  render() {
    return (
      <div id='outer'>
        <header id='inner_fixed'>Evidente</header>
        <div id='div-container-all' className='parent-div'>
          <Phylotree
            updateSNPTable={this.updateSNPTable}
            tree={this.state.tree}
            onShowMyNodes={this.my_showNodes}
            onZoom={this.state.zoom}
            onCollapse={this.handleCollapse}
            onDecollapse={this.handleDecollapse}
            onUploadTree={this.handleUploadTree}
            onHide={this.handleHide}
            onShowNodes={this.handleShow}
            selectedNodes={this.state.selectedNodes}
            onSelection={this.handleSelection}
            onCladeUpdate={this.handleCladeUpdate}
            newick={this.state.newick}
            snpdata={this.state.snpdata}
            taxadata={this.state.taxamd}
            ids={this.state.ids}
            mdinfo={this.state.mdinfo}
            activeFilters={this.state.activeFilters}
          />
          <Heatmap
            divID={"heatmap_viz"}
            containerID={"heatmap-container"}
            margin={{ top: 0, right: 20, bottom: 0, left: 100 }}
            tree={this.state.tree}
            nodes={this.state.nodes}
            hiddenNodes={this.state.hiddenNodes}
            collapsedClades={this.state.collapsedClades}
            selectedNodes={this.state.selectedNodes}
            ids={this.state.ids}
            visMd={this.state.visualizedMD}
            visSNPs={this.state.visualizedSNPs}
            SNPcolorScale={_.get(this.state.mdinfo, "SNP.colorScale", "")}
            taxadata={[]}
            snpdata={this.state.snpdata}
            mdinfo={[]}
            isSNP={true}
          />
          <Heatmap
            divID={"md_viz"}
            containerID={"md-container"}
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
            tree={this.state.tree}
            nodes={this.state.nodes}
            hiddenNodes={this.state.hiddenNodes}
            collapsedClades={this.state.collapsedClades}
            selectedNodes={this.state.selectedNodes}
            ids={this.state.ids}
            visMd={this.state.visualizedMD}
            visSNPs={[]}
            taxadata={this.state.taxamd}
            snpdata={[]}
            mdinfo={this.state.mdinfo}
            isSNP={false}
            createdFilters={this.state.createdFilters}
          />
          <Toolbox
            onApplyAllFilters={this.handleApplyAllFilter}
            onSNPaddition={this.handleSNPaddition}
            onFileUpload={this.handleSubmit}
            onMDChange={this.handleMDChange}
            onSNPChange={this.handleSNPChange}
            onColorChange={this.handleColorChange}
            onOpenFilter={this.handleFilterOpenModal}
            SNPTable={this.state.SNPTable}
            availableMDs={this.state.mdinfo}
            availableSNPs={this.state.availableSNPs}
            visMd={this.state.visualizedMD}
            visSNPs={this.state.visualizedSNPs}
            createdFilters={this.state.createdFilters}
            onDeleteFilter={this.handleDeleteFilter}
            onDeleteAllFilters={this.handleDeleteAllFilters}
          ></Toolbox>
        </div>
        <OrdinalModal
          ID='ordinal-modal'
          show={this.state.ordinalModalShow}
          ordinalValues={this.state.ordinalValues}
          handleClose={this.handleOrdinalCloseModal}
        ></OrdinalModal>
        <ColorScaleModal
          ID='color-scale-modal'
          mdinfo={this.state.mdinfo}
          chosenMD={this.chosenMD}
          show={this.state.colorScaleModalShow}
          handleClose={this.handleColorScaleCloseModal}
        ></ColorScaleModal>
        <FilterModal
          ID='filter-modal'
          mdinfo={this.state.mdinfo}
          show={this.state.filterModalShow}
          filterFeatures={this.state.filterFeatures || []}
          handleClose={this.handleFilterCloseModal}
        ></FilterModal>
      </div>
    );
  }
}

export default App;
