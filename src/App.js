// import logo from "./logo.svg";
import "./App.css";
import Phylotree from "./components/phylotree";
import Heatmap from "./components/heatmap";
import * as d3 from "d3";
import * as d3v5 from "d3v5";

import * as $ from "jquery";
// import { observable } from "mobx";
import "../node_modules/jquery/dist/jquery";
import "../node_modules/bootstrap/dist/js/bootstrap";
import React, { Component } from "react";
import Toolbox from "./components/toolbox";
import * as _ from "underscore";
import ConnectElements from "react-connect-elements";
import bootbox from "bootbox";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import { color } from "d3";

class App extends Component {
  state = {};
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
  constructor() {
    super();
    let tree = d3.layout.phylotree().options({
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
      // "align-tips": true,
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
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ name: event.target.value });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    // bootbox.dialog({
    //   message: $(`<Form id="fileform" onSubmit={this.props.onFileUpload}>
    //     <Form.File id="nwk-file" label="Newick Tree" name="nwk" custom />
    //     <Form.File id="snp-file" label="SNP table" name="snp" custom />
    //     <Button variant="primary" type="submit">
    //       Submit
    //     </Button>
    //   </Form>`).html(),
    // });
    const formData = new FormData(document.getElementById("fileform"));
    let response = await fetch(`/api/upload`, {
      method: "post",
      body: formData,
    });

    let json = await response.json();
    let metadataInfo = this.createColorScales(json.metadataInfo || {});
    this.setState({
      newick: json.newick,
      snpdata: { support: json.support, notsupport: json.notSupport },
      availableSNPs: json.availableSNPs,
      ids: json.ids,
      taxamd: json.taxaInfo || [],
      snpmd: json.snpInfo || [],
      mdinfo: metadataInfo,
    });
    // _.keys(this.state.mdinfo).map((d) => {
    //   console.log({ value: d, label: d });
    //   return { value: d, label: d };
    // });
  };

  createColorScales = (metadata) => {
    _.keys(metadata).forEach((k) => {
      console.log(metadata[k].extent);
      let colorScale =
        metadata[k].type.toLowerCase() === "numerical"
          ? d3.scale.linear().domain(metadata[k].extent).range(["blue", "red"])
          : metadata[k].type.toLowerCase() === "categorical"
          ? d3.scale.ordinal().domain(metadata[k].extent).range(this.color_cat)
          : d3.scale
              .ordinal()
              .domain(["A", "C", "T", "G", "N"])
              .range(["red", "yellow", "blue", "green", "purple"]);
      metadata[k].colorScale = colorScale;
    });
    return metadata;
  };

  // nodeStyler = (container, node) => {
  //   console.log("test");

  //   var compartment_labels = d3.scale
  //     .ordinal()
  //     .range(["circle", "square", "diamond", "triangle-down", "triangle-up"]);
  //   if (node[s"own-collapse"] || false) {
  //     var existing_circle = container.selectAll("circle");
  //     console.log("existing_circle:", existing_circle);
  //     existing_circle
  //       .attr("fill", "red !important")
  //       .attr("r", 4)
  //       .attr("opacity", 0.5);
  //     console.log("existing_circle:", existing_circle);

  //     existing_circle = container
  //       .selectAll("path.node_shape")
  //       .data([node.compartment]);
  //     existing_circle.enter().append("path").classed("node_shape", true);

  //     var bubble_size = this.state.tree.node_bubble_size(node);

  //     var label = existing_circle
  //       .attr("d", function (d) {
  //         return d3.svg
  //           .symbol()
  //           .type(compartment_labels(d))
  //           .size(bubble_size * bubble_size)();
  //       })
  //       .selectAll("title")
  //       .data([node.copy_number]);
  //     label.enter().append("title");
  //     label.text("" + node.copy_number + " copies");

  //     existing_circle.style("stroke-width", "1px").style("stroke", "black");
  //   }
  // };

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

  handleCladeUpdate = (oldName, newName) => {
    let clades = this.state.collapsedClades;
    let renamedClade = clades.find((x) => x.showname === oldName);
    renamedClade.showname = newName;

    let jointNodes = [
      ...this.state.collapsedClades.filter((x) => x.showname !== oldName),
      renamedClade,
    ];
    this.setState({ collapsedClades: jointNodes });
  };

  compareArrays = (array1, array2) => {
    return (
      array1.length === array2.length &&
      array1.sort().every(function (value, index) {
        return value === array2.sort()[index];
      })
    );
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
        d3.layout.phylotree.is_leafnode(node) ||
        (node.collapsed && d3.layout.phylotree.is_node_visible(node))
      );
    });
    this.setState({ selectedNodes: filteredSelection });
  };

  componentDidMount() {
    let zoom = this.state.zoom;
    // Adds zoom on both
    d3.select("#tree-display").call(zoom).call(zoom.event);
    d3.select("#display_heatmap").call(zoom).call(zoom.event);

    // // Uncomment to use loading function
    // let example_tree =
    //   "(((343:0.150276,CONGERA:0.213019)0.9600:0.230956,(45:0.263487,CONGERB:0.202633)0.9600:0.246917)0.9600:0.094785,((CAVEFISH:0.451027,(GOLDFISH:0.340495,ZEBRAFISH:0.390163)0.9600:0.220565)0.9600:0.067778,((((((NSAM:0.008113,NARG:0.014065)0.9600:0.052991,SPUN:0.061003,(SMIC:0.027806,SDIA:0.015298,SXAN:0.046873)0.9600:0.046977)0.9600:0.009822,(NAUR:0.081298,(SSPI:0.023876,STIE:0.013652)0.9600:0.058179)0.9600:0.091775)0.9600:0.073346,(MVIO:0.012271,MBER:0.039798)0.9600:0.178835)0.9600:0.147992,((BFNKILLIFISH:0.317455,(ONIL:0.029217,XCAU:0.084388)0.9600:0.201166)0.9600:0.055908,THORNYHEAD:0.252481)0.9600:0.061905)0.9600:0.157214,LAMPFISH:0.717196,((SCABBARDA:0.189684,SCABBARDB:0.362015)0.9600:0.282263,((VIPERFISH:0.318217,BLACKDRAGON:0.109912)0.9600:0.123642,LOOSEJAW:0.397100)0.9600:0.287152)0.9600:0.140663)0.9600:0.206729)0.9600:0.222485,(COELACANTH:0.558103,((CLAWEDFROG:0.441842,SALAMANDER:0.299607)0.9600:0.135307,((CHAMELEON:0.771665,((PIGEON:0.150909,CHICKEN:0.172733)0.9600:0.082163,ZEBRAFINCH:0.099172)0.9600:0.272338)0.9600:0.014055,((BOVINE:0.167569,DOLPHIN:0.157450)0.9600:0.104783,ELEPHANT:0.166557)0.9600:0.367205)0.9600:0.050892)0.9600:0.114731)0.9600:0.295021)";
    // this.setState({ newick: example_tree });
  }

  handleZoom() {
    $("#heatmap-container").attr(
      "transform",
      `translate(0,  ${d3.event.translate[1]} )scale(${d3.event.scale})`
    );
    $(".phylotree-container").attr(
      "transform",
      `translate( ${d3.event.translate} )scale(${d3.event.scale})`
    );
  }

  render() {
    return (
      <div id='outer'>
        <header id='inner_fixed'>Evidente</header>
        <div id='div-container-all' className='parent-div'>
          <Phylotree
            tree={this.state.tree}
            onZoom={this.state.zoom}
            onCollapse={this.handleCollapse}
            onDecollapse={this.handleDecollapse}
            onUploadTree={this.handleUploadTree}
            onHide={this.handleHide}
            onShowNodes={this.handleShow}
            onSelection={this.handleSelection}
            onCladeUpdate={this.handleCladeUpdate}
            newick={this.state.newick}
          />
          <Heatmap
            tree={this.state.tree}
            nodes={this.state.nodes}
            hiddenNodes={this.state.hiddenNodes}
            collapsedClades={this.state.collapsedClades}
            selectedNodes={this.state.selectedNodes}
            ids={this.state.ids}
            visMd={this.state.visualizedMD}
            visSNPs={this.state.visualizedSNPs}
            taxadata={this.state.taxamd}
            snpdata={this.state.snpdata}
            mdinfo={this.state.mdinfo}
          />
          <Toolbox
            onFileUpload={this.handleSubmit}
            onMDChange={this.handleMDChange}
            onSNPChange={this.handleSNPChange}
            availableMDs={this.state.mdinfo}
            availableSNPs={this.state.availableSNPs}
            visMd={this.state.visualizedMD}
            visSNPs={this.state.visualizedSNPs}
          ></Toolbox>
        </div>
      </div>
    );
  }
}

export default App;
