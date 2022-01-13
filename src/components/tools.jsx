import React, { Component } from "react";
import { Accordion, Button, Card, Form, OverlayTrigger, Tooltip, ButtonGroup } from "react-bootstrap";
import Select, { components } from "react-select";
import { filter, keys } from "lodash";
import * as $ from "jquery";
//import { select } from "d3";
import * as d3 from "d3";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
// import domtoimage from "dom-to-image";
import { Divider } from "@material-ui/core";

import HelpIcon from "@material-ui/icons/Help";

import FilterList from "./filter-list";
import VisualizeDataCard from "./visualize-card";
import FileUploadForm from "./file-upload-form";

/**
 * Helper Function for showing an information text box by hovering over "analyse tree"
 * option in toolbox
 */
const enterMouse = (event) => {
  const div = d3.select("#tooltip");
  div
    .transition()
    .duration(200)
    .style("max-width", "150px")
    .style("opacity", 0.9)
    .style("display", "flex");
  div
    .html(
      "Perform an GO-Enrichment for all clades owning supporting SNPs and receive all significant results"
    )
    .style("left", event.pageX + "px")
    .style("top", event.pageY - 28 + "px");
};

const outMouse = () => {
  const div = d3.select("#tooltip");
  div.transition().duration(500).style("opacity", 0).style("max-width", "");
};


const { ValueContainer, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  return (
    <ValueContainer {...props}>
      <Placeholder {...props} isFocused={props.isFocused}>
        {props.selectProps.placeholder}
      </Placeholder>
      {React.Children.map(children, (child) =>
        child && child.type !== Placeholder ? child : null
      )}
    </ValueContainer>
  );
};

const selectStates = {
  container: (provided, state) => ({
    ...provided,
    marginTop: 20,
    height: "auto",
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    overflow: "visible",
    height: "auto"
  }),
  menuList: (provided, state) => ({
    ...provided,
    maxHeight: "150px",
  }),
  placeholder: (provided, state) => ({
    ...provided,
    position: "absolute",
    top: state.hasValue || state.selectProps.inputValue ? -15 : "50%",
    transition: "top 0.1s, font-size 0.1s",
    fontSize: (state.hasValue || state.selectProps.inputValue) && 13,
    "white-space": "nowrap",
    overflow: "hidden",
    "text-overflow": "ellipsis",
  }),
};

/**
 * Contains all components of the tools menu
 *
 */
class Tools extends Component {
  state = { filterValue: [], selectedFeatures: [] };

  /**
   * Exports the main SVG to image in pdf document
   *
   */
  async onExport(type) {
    d3.selectAll(".overflow-allowed").classed("overflow-allowed", false).classed("overflow-blocked", true)
    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    let allData = document.getElementById("div-export");
    let mainVisualization = document.getElementById("parent-svg").cloneNode(true);
    let divLegend = document.createElement("div");
    divLegend.style.display = "flex";
    divLegend.style.flexWrap = "wrap";
    divLegend.style.padding = "5px";
    divLegend.id = "legend-blox";
    var figureName = "Evidente_" + Date.now();

    filter(this.props.metadataToRows(this.props.availableMDs), (v) => {
      return accountForLegend.includes(v.name);
    }).forEach((data) => {
      let blockLegendLabel = document.createElement("div");
      let labelLegend = document.createElement("p");
      labelLegend.textContent = data.name;
      let svgLegend = document.createElement("div");
      svgLegend.style.minHeight = 30;

      let legend = d3
        .select("#root")
        .append("svg")
        .attr({ id: `testing-output-${data.name.replace(/[^a-zA-Z0-9_-]/g, "_")}`, width: 250 });
      this.props.addLegend(legend, 250, data, true);
      svgLegend.appendChild(legend.node());
      blockLegendLabel.appendChild(labelLegend);
      blockLegendLabel.appendChild(svgLegend);
      divLegend.appendChild(blockLegendLabel);
    });
    // var allData = document.getElementById("parent-svg");
    mainVisualization.appendChild(divLegend);
    allData.appendChild(mainVisualization);
    const vis = allData
    html2canvas(vis, {
      scale: 6,
      width: vis.getBoundingClientRect().width,
      height: vis.getBoundingClientRect().height
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      let asPNG = "PNG" === type
      if (!asPNG) {
        // Multiplying by 1.33 because canvas.toDataURL increases the size of the image by 33%
        const pdf = new jsPDF('l', 'px', [canvas.width * 1.33, canvas.height * 1.33]);
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${figureName}.pdf`);
        allData.removeChild(mainVisualization);

      } else {
        const aDownloadLink = document.createElement('a');
        aDownloadLink.download = `${figureName}.png`;
        aDownloadLink.href = imgData;
        aDownloadLink.click();
        allData.removeChild(mainVisualization);

      }
      d3.selectAll(".overflow-blocked").classed("overflow-allowed", true).classed("overflow-blocked", false)

    });



  }

  /**
   * Creates the labels and values for the correspoinding selecting menu
   * @param {dictionary of metadata} metadata
   */
  getMetadata(metadata) {
    return keys(metadata)
      .filter((d) => !["SNP", "Information"].includes(d))
      .map((d) => {
        return { value: d, label: d };
      });
  }

  /**
   *
   * @param {String} nameOfFilters, name of the selected filters
   */
  onChangeFilter = (value) => {
    this.setState({ selectedFeatures: value.map(({ value }) => value), filterValue: value });
  };

  /**
   * Updates the file name after selection.
   *
   * @param {Object} FileObject saves all files from the form
   * @param {String} label saves the corresponding label to the file
   */
  onFileChange = ({ target }, label) => {
    if (target.files[0] !== undefined) {
      let fileName = target.files[0].name;
      $(target)
        .next(".custom-file-label")
        .css({
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "default",
          paddingRight: "30%",
          display: "inline-block",
        })
        .html(`${label}: ${fileName}`);
    }
  };

  onLatestResult = (type) => {
    if (type === "tree") {
      this.props.showLatestResultsTree();
    } else if (type === "clade") {
      this.props.showLatestResults();
    }
  };

  render() {
    return (
      <div>
        <h4>{this.props.children}</h4>
        <Accordion id='tools' defaultActiveKey='0'>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='0'
              id='files-card'
              className='noselect header-accordion'
            >
              Load files
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='0'>
              <Card.Body>
                <FileUploadForm loadFiles={this.props.loadFiles} />
              </Card.Body>
            </Accordion.Collapse>
          </Card>

          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='2'
              id='metadata-card'
              className='noselect header-accordion'
            >
              Visualize data
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='2'>
              <VisualizeDataCard
                availableMDs={this.props.availableMDs}
                availableSNPs={this.props.availableSNPs}
                visSNPs={this.props.visSNPs}
                visMd={this.props.visMd}
                onSNPChange={this.props.onSNPChange}
                onMDChange={this.props.onMDChange}
                getMetadata={this.getMetadata}
              />
            </Accordion.Collapse>
          </Card>

          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='3'
              id='filtering-card'
              className='noselect header-accordion'
            >
              Filter nodes
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='3'>
              <Card.Body>
                <Form.Group key='metadatafilter'>
                  <Form.Label size={"sm"}>Create a filter group with metadata <OverlayTrigger style={{ "z-index": 1 }} placement='top' overlay={
                    <Tooltip id={`tooltip-tree-analysis`}>
                      A filter group defines all the characteristics a certain node should contain in order to be
                      shown. Within filter groups, the nodes need to belong to at least one group to be shown.</Tooltip>
                  }>
                    <HelpIcon />
                  </OverlayTrigger>
                  </Form.Label>
                  <Select
                    id='select-filter'
                    options={this.getMetadata(this.props.availableMDs)}
                    isMulti
                    value={this.state.filterValue}
                    onChange={this.onChangeFilter}
                    placeholder={"Select metadata for filter group"}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    menuPortalTarget={document.getElementById("tools")}
                    menuPosition={"fixed"}
                    styles={selectStates}
                  />
                </Form.Group>
                <Button
                  variant='primary'
                  disabled={this.state.selectedFeatures.length === 0}
                  onClick={() => {
                    this.setState({ filterValue: null, selectedFeatures: [] });
                    this.props.onOpenFilter(this.state.selectedFeatures);
                  }}
                >
                  Create filter group
                </Button>
                {this.props.createdFilters.length > 0 && (
                  <React.Fragment>
                    <Divider variant='middle' style={{ marginTop: "5px", marginBottom: "5px" }} />
                    <h6>Created filter groups</h6>
                    <h6 style={{ fontWeight: "normal" }}>
                      Applying following filter would result in {this.props.remainingNodes}{" "}
                      {this.props.remainingNodes > 1 || this.props.remainingNodes === 0
                        ? "nodes"
                        : "node"}
                    </h6>

                    <FilterList
                      remainingNodes={this.props.remainingNodes}
                      availableMDs={this.props.availableMDs}
                      onApplyAllFilters={this.props.onApplyAllFilters}
                      nameOfFilters={this.props.nameOfFilters}
                      createdFilters={this.props.createdFilters}
                      onDeleteFilter={this.props.onDeleteFilter}
                      onDeleteAllFilters={this.props.onDeleteAllFilters}
                    />
                  </React.Fragment>
                )}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='4'
              id='tree-card'
              className='noselect header-accordion'
              onMouseOver={enterMouse}
              onMouseOut={outMouse}
            >
              Statistical Analysis
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='4'>
              <Card.Body>
                <Form id='tree-enrichment'>
                  <Form.Label size={"sm"}>Tree Analysis <OverlayTrigger style={{ "z-index": 1 }} placement='top' overlay={
                    <Tooltip id={`tooltip-tree-analysis`}>
                      For each clade with at least one supporting SNP, an enrichment analysis is computed.</Tooltip>
                  }>
                    <HelpIcon />
                  </OverlayTrigger></Form.Label>
                  <Form.Group id='group'>
                    <Form.Label size={"sm"}>
                      Significance Level
                    </Form.Label>
                    <Form.Control size={"sm"} id='sig-level-tree' type='text' defaultValue='0.05' />
                  </Form.Group>
                </Form>
                <Button variant='primary' onClick={this.props.onStatisticsTreeRequest}>
                  Find enriched Clades
                </Button>
                <h6>
                  Previous Results
                </h6>
                <ButtonGroup aria-label="Basic example">
                  {["Clade", "Tree"].map((typeOfResult) => (
                    <Button
                        size={"sm"}
                      key={typeOfResult}
                      variant='secondary'
                      onClick={() => this.onLatestResult(typeOfResult.toLowerCase())}
                    >
                      {typeOfResult} analysis
                    </Button>
                  ))}
                </ButtonGroup>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='6'
              id='export-card'
              className='noselect header-accordion'
            >
              Export visualization
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='6'>
              <Card.Body>
                <Form>
                  <Form.Label size={"sm"}>
                    Export visualizations
                  </Form.Label>
                  <Form.Group>
                    <Button
                      variant='primary'
                      onClick={() => {
                        this.props.handleLoadingToggle(true);
                        this.onExport("PNG");
                        this.props.handleLoadingToggle(false);
                      }}
                    >
                      As PNG
                    </Button>
                    <Button
                      variant='primary'
                      onClick={() => {
                        this.props.handleLoadingToggle(true);
                        this.onExport("PDF");
                        this.props.handleLoadingToggle(false);
                      }}
                    >
                      As PDF
                    </Button>
                  </Form.Group>
                </Form>
                {/* <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
        {["PDF", "PNG", "JPEG"].map((typeOfExport) => (
          <Grid key={typeOfExport} item>
            <Button
              variant='primary'
              onClick={() => this.onExport(typeOfExport.toLowerCase())}
              >
              As {typeOfExport}
            </Button>
          </Grid>
        ))}
      </Grid> */}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
