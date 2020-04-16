// import logo from "./logo.svg";
import "./App.css";
import Phylotree from "./components/phylotree";
import Heatmap from "./components/heatmap";
import * as d3 from "d3";
import * as $ from "jquery";
// import { observable } from "mobx";
import "../node_modules/jquery/dist/jquery";
import "../node_modules/bootstrap/dist/js/bootstrap";
import React, { Component } from "react";
import Toolbox from "./components/toolbox";
import bootbox from "bootbox";
import { Accordion, Card, Button, Form } from "react-bootstrap";

class App extends Component {
  state = {};

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
    fetch(`/api/upload`, { method: "post", body: formData })
      .then((response) => {
        return response.json();
      })
      .then((res) => console.log(res));
    // .then((state) => console.log);
  };

  handleFileUpload = (el) => {
    let file = el.files[0];
    console.log(file);
    let r = new FileReader();
    let content = "";
    r.onload = async (e) => {
      content = e.target.result;
      this.setState({ newick: content });
    };
    let s = r.readAsText(file);
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
    this.handleCladeCreation();
    let jointNodes = this.state.collapsedClades.concat([clade]);
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
    console.log(this.state);
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
        d3.layout.phylotree.is_leafnode(node) || node.collapsed
        // &&
        // d3.layout.phylotree.is_node_visible(node)
      );
    });
    this.setState({ selectedNodes: filteredSelection });
  };

  componentDidMount() {
    let zoom = this.state.zoom;
    // Adds zoom on both
    d3.select("#tree-display").call(zoom).call(zoom.event);
    d3.select("#display_heatmap").call(zoom).call(zoom.event);

    // Uncomment to use loading function
    // let example_tree =
    // "((((((((((((((((MI2-10_Guinea_2016:1.00000000,MI6-55_Guinea_2016:0.00000000)0.9600:1.00000000,MI6-50_Guinea_2016:0.00000000)1.0000:5.00000000,Ml9-83_Mali_2014:4.00000000)0.9800:3.00000000,(Ml10-99_Mali_2016:9.00000000,(Ml10-95_Mali_2016:2.00000000,Ml10-97_Mali_2016:2.00000000)0.5100:0.00000000)0.9600:1.00000000)0.5000:0.00000000,(Ml10-93_Mali_2016:6.00000000,((Ng12-33_Niger_2015:8.00000000,Ng17-39_Niger_2015:8.00000000)0.9700:2.00000000,(Ml9-86_Mali_2014:4.00000000,(Ng15-37_Niger_2015:7.00000000,(Ml10-91_Mali_2016:11.00000000,S13_Mali_2012:15.00000000)0.5400:0.00000000)0.5400:0.00000000)0.5000:0.00000000)0.5400:0.00000000)0.5200:0.00000000)1.0000:3.00000000,(Ng13-32_Niger_2015:2.00000000,(Ng15-36_Niger_2015:8.00000000,Ng16-38_Niger_2015:5.00000000)1.0000:3.00000000)1.0000:3.00000000)0.9800:1.00000000,(Bn8-52_Benin_2015:14.00000000,(Gu4-17L_Guinea_2014:9.00000000,(Ml10-94_Mali_2016:14.00000000,(Ml9-79_Mali_2016:10.00000000,Ml9-81_Mali_2014:8.00000000)0.5000:0.00000000)0.4900:0.00000000)0.5100:0.00000000)0.9900:1.00000000)0.9600:2.00000000,((Bn8-51-1+2_Benin_2015:9.00000000,Ml9-84_Mali_2014:17.00000000)1.0000:7.00000000,(ML2-5_Mali_2012:10.00000000,(Br2016-15_Brazil_2016:96.66666667,(Br14-1_Brazil_2014:2.25000000,Br14-2_Brazil_2014:3.00000000)1.0000:12.25000000)1.0000:13.25000000)1.0000:8.58333333)0.5800:1.00000000)0.5000:0.00000000,((Br2016-14_Brazil_2016:2.50000000,Br2016-16_Brazil_2016:5.00000000)1.0000:8.50000000,(Ml10-98_Mali_2016:13.00000000,(Br14-5_Brazil_2014:18.00000000,((((3208-2007_Brazil_2007:0.00000000,3208-2015_Brazil_2015:2.00000000)1.0000:4.00000000,2DDS_Brazil_2015:5.00000000)0.9800:3.00000000,Br2016-26_Brazil_2016:4.00000000)0.9900:4.00000000,(Br1_Brazil_2013:1.00000000,(Br14-4_Brazil_2014:6.00000000,(Br2016-24_Brazil_2016:3.00000000,Br2016-27_Brazil_2016:1.00000000)0.5200:0.00000000)0.5300:0.50000000)0.9800:2.50000000)0.9700:5.00000000)0.7600:1.00000000)0.5700:0.00000000)0.9600:9.00000000)0.6100:0.00000000,(97016_French_West_Indies_2000:7.00000000,(Bn7-39_Benin_2015:9.00000000,(Bn7-41_Benin_2015:12.00000000,Bn8-46_Benin_2015:6.00000000)0.5700:0.00000000)0.9800:1.00000000)0.9900:2.00000000)0.9400:10.00000000,((((((7Q90:0.00000000,BrMM2_Brazil_2013:0.00000000)0.5100:0.00000000,BrMM1_Brazil_2013:0.00000000)0.5400:0.00000000,Br4923_Brazil_2004:8.83333333)0.8300:2.83333333,1126-2011_Brazil_2011:9.00000000)0.8200:2.33333333,Ml10-96_Mali_2016:15.00000000)0.8300:5.00000000,((Gu4-19L_Guinea_2014:5.00000000,Ml9-80_Mali_2014:7.00000000)1.0000:3.00000000,(S14_Mali_2012:15.00000000,(Gu5-23_Guinea_2014:19.00000000,(Ml9-82_Mali_2014:10.00000000,Ml9-87_Mali_2014:10.00000000)0.5100:0.00000000)0.5100:0.00000000)0.9300:0.00000000)1.0000:6.00000000)0.8300:2.00000000)0.7800:1.00000000,((Ch4_Sierra_Leone_2009:9.00000000,SM1_West_Africa_1979:4.00000000)1.0000:20.00000000,(2188-2007_Brazil_2007:0.00000000,(2188-2014_Brazil_2014:13.00000000,Ng13-33_Niger_2015:21.00000000)0.6200:0.00000000)0.5300:0.00000000)0.5500:0.00000000)0.5500:9.00000000,Body_188_Czech_Republic_800-1200:7.00000000)0.5500:14.50000000,S15_New_Caledonia_1992:153.00000000)0.5500:5.50000000,((((7935681:0.00000000,US57_Marshall_Islands_2000:3.00000000)1.0000:5.00000000,3125609:4.00000000)1.0000:29.00000000,(Ryukyu-2_Japan_2000:18.50000000,(Amami_Japan_2000:63.00000000,Zensho-9_Japan_2000:122.50000000)0.7400:2.50000000)1.0000:13.50000000)1.0000:44.00000000,((CM1_Philippines_1994:45.50000000,S9_New_Caledonia_1996:57.50000000)1.0000:12.00000000,((Jorgen_507_Denmark_1058-1253:23.00000000,SK11_Hungary_600-800:0.00000000)1.0000:42.00000000,(S10_China_2006:29.00000000,(((Izumi_Japan_2000:11.00000000,Kitasato_Japan_2000:5.33333333)0.9800:4.33333333,(Kanazawa_Japan_2000:4.25000000,Oku-4_Japan_2000:9.00000000)1.0000:4.25000000)0.9600:3.58333333,(((Kyoto-1_Japan_2000:10.00000000,Kyoto-2_Japan_1991:16.00000000)0.9700:2.00000000,Korea-3-2_Korea_2000:5.00000000)0.9700:2.00000000,((Tsukuba-1_Japan_2000:10.00000000,Zensho-2_Japan_2000:11.00000000)0.5300:0.00000000,(Zensho-4_Japan_2000:39.50000000,Zensho-5_Japan_2000:0.00000000)0.9200:39.50000000)0.9100:2.00000000)0.9600:5.00000000)1.0000:13.75000000)1.0000:32.50000000)1.0000:11.00000000)1.0000:30.00000000)0.9800:2.00000000)0.5500:4.00000000,(((((((ARLP-29_Ethiopia_2015:6.00000000,ARPL-10_Ethiopia_2015:8.00000000)0.5300:0.00000000,ARLP-13_Ethiopia_2015:7.00000000)0.5400:0.00000000,ARLP-49_Ethiopia_2015:9.00000000)1.0000:8.00000000,ARLP-68_Ethiopia_2015:7.00000000)1.0000:17.00000000,(ARLP-57_Ethiopia_2015:12.00000000,((ARLP-32_Ethiopia_2015:14.00000000,ARLP-40_Ethiopia_2015:11.00000000)0.5100:0.00000000,(ARLP-73_Ethiopia_2015:0.50000000,ARLP-74_Ethiopia_2015:0.50000000)1.0000:9.00000000)0.5000:0.00000000)0.9500:1.00000000)0.9800:2.00000000,(ARLP-11_Ethiopia_2015:7.00000000,ARPL-07_Ethiopia_2015:5.00000000)1.0000:16.00000000)1.0000:40.00000000,(((((((SK14_UK_923-971:1.50000000,SK8_UK_1010-1160:0.00000000)1.0000:8.50000000,Refshale_16_Denmark_1017-1065:5.00000000)0.9800:2.33333333,3077_Sweden_993-1031:6.00000000)0.5100:0.33333333,T18_Italy_600-700:6.00000000)0.5700:1.33333333,(Jorgen_749_Denmark_1223-1279:13.00000000,SK27_UK_1020-1162:17.00000000)0.5600:5.00000000)0.8600:0.00000000,(ARLP-14_Ethiopia_2015:4.50000000,ARLP-46_Ethiopia_2015:8.50000000)1.0000:34.00000000)1.0000:13.00000000,(((((((ARLP-23_Ethiopia_2015:9.00000000,ARLP-37_Ethiopia_2015:11.00000000)1.0000:5.00000000,ARLP-62_Ethiopia_2015:24.00000000)1.0000:8.00000000,(Ye2-3_Yemen_2014:9.00000000,Ye4-10_Yemen_2015:15.00000000)0.8300:2.00000000)0.8200:2.00000000,Ye4-11_Yemen_2015:24.00000000)0.7800:1.00000000,(ARLP_30_Ethiopia_2015:9.00000000,ARLP-52_Ethiopia_2015:5.00000000)1.0000:7.00000000)1.0000:21.00000000,(ARLP-12_Ethiopia_2015:34.00000000,(ARLP-27_Ethiopia_2015:39.00000000,(ARLP-20_Ethiopia_2015:7.00000000,ARLP-25_Ethiopia_2015:11.50000000)1.0000:16.50000000)0.9900:2.00000000)0.9700:1.00000000)1.0000:12.00000000,((((((Pak_Pakistan_2010:5.00000000,S11_India_1990:10.00000000)0.5600:0.00000000,1262-16_Pakistan_2016:11.00000000)1.0000:21.00000000,Ye4-12_Yemen_2015:37.00000000)1.0000:3.00000000,(Ye4-8_Yemen_2015:33.00000000,(Airaku3_Japan_1996:31.00000000,Thai-311_Thailand_2000:2.00000000)0.9800:13.00000000)0.9700:1.00000000)0.9800:9.00000000,Br2016-18_Brazil_2016:48.00000000)0.9900:3.00000000,(AL7:0.00000000,((2936_Malawi_2000:33.00000000,AL7_2:0.00000000)0.4900:0.00000000,(S2_West_Indies_1992:35.00000000,((LRC-1A_Japan_2000:12.00000000,Thai-237_Thailand_2000:11.00000000)1.0000:7.00000000,(Indonesia-1_Indonesia_2000:16.00000000,(TN_India_1981:22.00000000,Thai53_Thailand_2005:21.00000000)0.9700:2.00000000)0.6400:0.00000000)0.9600:21.00000000)0.9500:7.00000000)0.4900:0.00000000)0.5000:0.00000000)0.5700:3.00000000)0.6400:5.00000000)0.6600:2.00000000)0.6600:7.00000000,((Jorgen_533_Denmark_1044-1214:14.00000000,Jorgen_625_Denmark_1283-1329:19.50000000)1.0000:9.50000000,((((((Br2016-45_Brazil_2016:15.00000000,Jorgen_427_Denmark_1164-1258:5.00000000)0.5400:0.00000000,Jorgen_404_Denmark_1219-1276:0.00000000)0.5500:0.00000000,Jorgen_722_Denmark_1256-1377:14.00000000)0.9800:11.00000000,GC96_UK_415-545:7.00000000)0.9900:2.00000000,(Brw15-5_UK_2015:0.00000000,(Brw15-20_UK_2015:0.00000000,(Brw15-1_UK_2015:2.00000000,(Brw15-10_UK_2015:1.00000000,Brw15-25_UK_2015:0.00000000)0.5000:0.00000000)0.5500:0.00000000)0.5200:0.00000000)1.0000:33.00000000)0.9900:2.00000000,(SK2_UK_1198-1244:11.00000000,(((Br2016-47_Brazil_2016:8.00000000,BrMM4_Brazil_2013:2.00000000)1.0000:5.50000000,Br2016-46_Brazil_2016:11.00000000)1.0000:6.50000000,(((((Br14-3_Brazil_2014:151.00000000,BrMM5_Brazil_2013:3.00000000)0.8900:1.00000000,Br2016-20_Brazil_2016:1.00000000)0.9100:0.00000000,(Br2016-17_Brazil_2016:0.00000000,Br2016-19_Brazil_2016:1.00000000)0.9800:3.00000000)1.0000:6.00000000,Br2016-21_Brazil_2016:13.00000000)0.9600:2.00000000,((85054_Martinique_1990:49.00000000,BP_Brazil_2013:5.00000000)1.0000:7.00000000,((((EGG_Mexico_2016:10.00000000,NHDP-98_USA_2004:1.00000000)0.5100:0.00000000,AL6:1.00000000)0.5100:0.00000000,AL5:27.00000000)0.6000:0.00000000,((NHDP63_USA_2004:9.00000000,W-09_USA_2005:1.00000000)0.9000:1.00000000,(5L116:0.00000000,(NHDP-55_USA_2004:0.00000000,(5L113:0.00000000,8T70:0.00000000)0.5400:0.00000000)0.9300:1.00000000)0.4900:1.00000000)0.5100:6.00000000)0.5100:5.00000000)0.5100:3.00000000)0.5000:2.00000000)0.5100:3.00000000)0.5100:15.00000000)0.5100:3.00000000)0.5100:17.00000000);";
    let example_tree =
      "(((343:0.150276,CONGERA:0.213019)0.9600:0.230956,(45:0.263487,CONGERB:0.202633)0.9600:0.246917)0.9600:0.094785,((CAVEFISH:0.451027,(GOLDFISH:0.340495,ZEBRAFISH:0.390163)0.9600:0.220565)0.9600:0.067778,((((((NSAM:0.008113,NARG:0.014065)0.9600:0.052991,SPUN:0.061003,(SMIC:0.027806,SDIA:0.015298,SXAN:0.046873)0.9600:0.046977)0.9600:0.009822,(NAUR:0.081298,(SSPI:0.023876,STIE:0.013652)0.9600:0.058179)0.9600:0.091775)0.9600:0.073346,(MVIO:0.012271,MBER:0.039798)0.9600:0.178835)0.9600:0.147992,((BFNKILLIFISH:0.317455,(ONIL:0.029217,XCAU:0.084388)0.9600:0.201166)0.9600:0.055908,THORNYHEAD:0.252481)0.9600:0.061905)0.9600:0.157214,LAMPFISH:0.717196,((SCABBARDA:0.189684,SCABBARDB:0.362015)0.9600:0.282263,((VIPERFISH:0.318217,BLACKDRAGON:0.109912)0.9600:0.123642,LOOSEJAW:0.397100)0.9600:0.287152)0.9600:0.140663)0.9600:0.206729)0.9600:0.222485,(COELACANTH:0.558103,((CLAWEDFROG:0.441842,SALAMANDER:0.299607)0.9600:0.135307,((CHAMELEON:0.771665,((PIGEON:0.150909,CHICKEN:0.172733)0.9600:0.082163,ZEBRAFINCH:0.099172)0.9600:0.272338)0.9600:0.014055,((BOVINE:0.167569,DOLPHIN:0.157450)0.9600:0.104783,ELEPHANT:0.166557)0.9600:0.367205)0.9600:0.050892)0.9600:0.114731)0.9600:0.295021)";
    this.setState({ newick: example_tree });
  }

  handleZoom() {
    $("#heatmap-container").attr(
      "transform",
      "translate(0," + d3.event.translate[1] + ")scale(" + d3.event.scale + ")"
    );
    $(".phylotree-container").attr(
      "transform",
      "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
    );
  }

  render() {
    return (
      <div id="outer">
        <header id="inner_fixed">Evidente</header>
        <div id="div-container-all" className=" parent-div">
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
          />
          <Toolbox onFileUpload={this.handleSubmit}></Toolbox>
        </div>
      </div>
    );
  }
}

export default App;
