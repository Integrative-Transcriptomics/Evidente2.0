import React, { Component } from "react";
import { Accordion, Card, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import Select, { components } from "react-select";
import { filter, keys } from "lodash";
import * as $ from "jquery";
import * as d3 from "d3";

import { Typography, Divider, Grid } from "@material-ui/core";

import HelpIcon from "@material-ui/icons/Help";

import FilterList from "./filter-list";
import VisualizeDataCard from "./visualize-card";

/**
 * Helper function for the filter tooltip
 * @param {Object} props
 */
const helpTooltip = (props) => {
  return (
    <Tooltip id='help-filter-tooltip' {...props}>
      A filter group defines all the characteristics a certain node should contain in order to be
      shown. Within filter groups, the nodes need to belong to at least one group to be shown.
    </Tooltip>
  );
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
    height: "auto",
    // maxHeight: "5px",
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

class Tools extends Component {
  state = { filterValue: [], selectedFeatures: [] };

  /**
   * Exports the main SVG to the selected type.
   *
   * @param {String} typeOfExport defines the type of export that is run: PNG, JPEG, PDF
   */
  async onExport(type) {
    this.props.handleLoadingToggle(true);

    let accountForLegend = [...this.props.visMd, this.props.visSNPs.length > 0 ? "SNP" : null];
    let allData = document.createElement("div");
    let mainVisualization = document.getElementById("parent-svg");
    allData.appendChild(mainVisualization.cloneNode(true));
    let divLegend = document.createElement("div");
    divLegend.style.display = "flex";
    divLegend.style.flexWrap = "wrap";
    divLegend.style.padding = "5px";
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
        .attr({ id: `testing-output-${data.name.replace(/[^a-zA-Z0-9_-]/g, "_")}`, width: 350 });
      this.props.addLegend(legend, 250, data, true);
      svgLegend.appendChild(legend.node());
      blockLegendLabel.appendChild(labelLegend);
      blockLegendLabel.appendChild(svgLegend);
      divLegend.appendChild(blockLegendLabel);
    });
    allData.appendChild(divLegend);

    let response = await fetch("/api/export", {
      method: "post",
      body: JSON.stringify({ htmlContent: allData.outerHTML, typeOf: type }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((e) => alert(e));

    let responseBlob = await response.blob();
    const url = window.URL.createObjectURL(responseBlob);
    let link = document.createElement("a");
    link.href = url;
    link.download = `export_evidente.${type}`;
    this.props.handleLoadingToggle(false);

    link.click();
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
                <Form id='fileform' onSubmit={this.props.onFileUpload}>
                  {[
                    { id: "nwk", label: "Newick Tree" },
                    { id: "snp", label: "SNP Table" },
                    { id: "taxainfo", label: "Taxa metadata" },
                    // { id: "SNPinfo", label: "SNP metadata" },
                  ].map(({ id, label }) => (
                    <Form.Group key={id}>
                      <Form.File
                        id={id}
                        label={label}
                        name={id}
                        custom
                        onChange={(el) => this.onFileChange(el, label)}
                      />
                    </Form.Group>
                  ))}
                  <Button variant='primary' type='submit'>
                    Submit
                  </Button>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='1'
              id='metadata-card'
              className='noselect header-accordion'
            >
              Visualize data
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='1'>
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
              eventKey='2'
              id='filtering-card'
              className='noselect header-accordion'
            >
              Filter nodes
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='2'>
              <Card.Body>
                <Grid container spacing={2} direction='row' alignItems='center'>
                  <Grid item>
                    <Typography variant='h6'>Create a filter group with metadata</Typography>
                  </Grid>
                  <Grid item>
                    <OverlayTrigger placement='top' overlay={helpTooltip}>
                      <HelpIcon style={{ display: "flex" }} />
                    </OverlayTrigger>
                  </Grid>
                </Grid>

                <Form.Group key='metadatafilter'>
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
                  ></Select>
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
                    <Typography variant='h6'>Created filter groups</Typography>
                    <Typography variant='h6' style={{ fontWeight: "normal" }}>
                      Applying following filter would result in {this.props.remainingNodes}{" "}
                      {this.props.remainingNodes > 1 || this.props.remainingNodes === 0
                        ? "nodes"
                        : "node"}
                    </Typography>

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
              eventKey='3'
              id='export-card'
              className='noselect header-accordion'
            >
              Export visualization
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='3'>
              <Card.Body>
                <Typography variant='h6' gutterBottom={true}>
                  Export visualizations
                </Typography>
                <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
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
                </Grid>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
