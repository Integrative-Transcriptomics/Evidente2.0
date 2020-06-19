import React, { Component } from "react";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import Select, { components } from "react-select";
import * as _ from "lodash";
import * as $ from "jquery";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
import { Typography, Divider, Grid } from "@material-ui/core";
import Legend from "./legend";
import FilterList from "./filter-list";

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
  }),
  placeholder: (provided, state) => ({
    ...provided,
    position: "absolute",
    top: state.hasValue || state.selectProps.inputValue ? -15 : "50%",
    transition: "top 0.1s, font-size 0.1s",
    fontSize: (state.hasValue || state.selectProps.inputValue) && 13,
  }),
};
class Tools extends Component {
  state = { value: [] };

  async onExport(type) {
    let data = document.getElementById("parent-svg");
    console.log(data.outerHTML);
    let response = await fetch("/api/export", {
      method: "post",
      body: `data=${data.outerHTML}&type=${type}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).catch((e) => alert(e));

    let responseBlob = await response.blob();
    const url = window.URL.createObjectURL(responseBlob);
    let link = document.createElement("a");
    link.href = url;
    link.download = `export_evidente.${type}`;
    link.click();
  }

  // async onPDFExport() {
  //   let data = document.getElementById("parent-svg");
  //   console.log(data.outerHTML);
  //   let response = await fetch("/api/pdf", {
  //     method: "post",
  //     body: `data=${data.outerHTML}`,
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded",
  //       // Accept: "application/json, text/plain, */*",
  //     },
  //   }).catch((e) => alert(e));

  //   let responseBlob = await response.blob();
  //   const url = window.URL.createObjectURL(responseBlob);
  //   let link = document.createElement("a");
  //   link.href = url;
  //   link.download = "download.pdf";
  //   link.click();

  // let element = document.getElementById("parent-svg");
  // html2canvas(element, {
  //   x: -15,
  //   y: -15,
  //   width: element.getBoundingClientRect().width + 30,
  //   height: 1500,
  // }).then((viz) => {
  //   const imgData = viz.toDataURL("image/png");
  //   const pdf = new jsPDF("l", "px", [viz.width * 1.33, viz.height * 1.33]);

  //   pdf.addImage(imgData, "PNG", 0, 0, viz.width, viz.height);
  //   pdf.save("download.pdf");
  // });
  // }
  // async onExportPNG() {
  //   let data = document.getElementById("parent-svg");
  //   console.log(data.outerHTML);
  //   let response = await fetch("/api/jpg", {
  //     method: "post",
  //     body: `data=${data.outerHTML}`,
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded",
  //       // Accept: "application/json, text/plain, */*",
  //     },
  //   });

  //   let pdfBlob = await response.blob();

  //   const url = window.URL.createObjectURL(pdfBlob);
  //   let link = document.createElement("a");
  //   link.href = url;
  //   link.download = "download.png";
  //   link.click();
  // }
  // onExportPNG() {
  //   let element = document.getElementById("parent-svg");

  //   html2canvas(element, {
  //     x: -15,
  //     y: -15,
  //     width: element.getBoundingClientRect().width + 30,
  //     height: 1000,
  //   }).then((viz) => {
  //     let link = document.createElement("a");
  //     link.href = viz.toDataURL("image/png");
  //     link.download = "download.png";
  //     link.click();
  //   });
  // }

  onChangeFilter = (value) => {
    this.setState({ selectedFeatures: value.map(({ value }) => value), value: value });
  };
  onFileChange = ({ target }, label) => {
    if (target.files[0] !== undefined) {
      let fileName = target.files[0].name;
      $(target).next(".custom-file-label").html(`${label}: ${fileName}`);
    }
  };
  /**
   * Creates the labels and values for the correspoinding selecting menu
   * @param {dictionary of metadata} metadata
   */
  getMetadata(metadata) {
    return _.keys(metadata)
      .filter((d) => !["SNP", "Information"].includes(d))
      .map((d) => {
        return { value: d, label: d };
      });
  }
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
        <Accordion id='tools' defaultActiveKey='0'>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='0'
              id='files-card'
              className='noselect header-accordion'
            >
              Load Files
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='0'>
              <Card.Body>
                <Form id='fileform' onSubmit={this.props.onFileUpload}>
                  {[
                    { id: "nwk", label: "Newick Tree" },
                    { id: "snp", label: "SNP Table" },
                    { id: "taxainfo", label: "Taxa metadata" },
                    { id: "SNPinfo", label: "SNP metadata" },
                    { id: "decoding", label: "Decoding files" },
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
              View Metadata
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='1'>
              <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
                <Typography variant='h6'>Select to visualize</Typography>
                <Select
                  id='snpdatashow'
                  options={(this.props.availableSNPs || []).map((d) => ({ value: d, label: d }))}
                  value={(this.props.visSNPs || []).map((d) => ({ value: d, label: d }))}
                  onChange={this.props.onSNPChange}
                  placeholder={"Visualize SNPs"}
                  isMulti
                  components={{
                    ValueContainer: CustomValueContainer,
                  }}
                  menuPortalTarget={document.getElementById("tools")}
                  styles={selectStates}
                ></Select>
                <Select
                  id='metadatashow'
                  options={this.getMetadata(this.props.availableMDs || [])}
                  onChange={this.props.onMDChange}
                  isMulti
                  placeholder={"Visualize Taxa Metadata"}
                  components={{
                    ValueContainer: CustomValueContainer,
                  }}
                  menuPortalTarget={document.getElementById("tools")}
                  styles={selectStates}
                ></Select>
                <Legend
                  availableMDs={this.props.availableMDs}
                  onChange={this.props.onColorChange}
                />
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle
              as={Card.Header}
              eventKey='2'
              id='filtering-card'
              className='noselect header-accordion'
            >
              Filter Nodes
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='2'>
              <Card.Body>
                <Typography variant='h6'>Filter nodes by metadata</Typography>

                <Form.Group key='metadatafilter'>
                  <Select
                    id='select-filter'
                    options={this.getMetadata(this.props.availableMDs || [])}
                    isMulti
                    value={this.state.value}
                    onChange={this.onChangeFilter}
                    placeholder={"Select Metadata for Filter"}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    menuPortalTarget={document.getElementById("tools")}
                    styles={selectStates}
                  ></Select>
                </Form.Group>

                <Button
                  variant='primary'
                  onClick={() => {
                    this.setState({ value: null, selectedFeatures: [] });
                    this.props.onOpenFilter(this.state.selectedFeatures);
                  }}
                >
                  Create filter
                </Button>
                {this.props.createdFilters.length > 0 && (
                  <React.Fragment>
                    <Divider variant='middle' style={{ marginTop: "5px", marginBottom: "5px" }} />
                    <Typography variant='h6'>Active Filters</Typography>
                    <FilterList
                      availableMDs={this.props.availableMDs}
                      onApplyAllFilters={this.props.onApplyAllFilters}
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
              Export visualization{" "}
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='3'>
              <Card.Body>
                <Typography variant='h6'>Export visualizations</Typography>
                <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
                  <Grid item>
                    <Button variant='primary' onClick={() => this.onExport("pdf")}>
                      As PDF
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant='primary' onClick={() => this.onExport("png")}>
                      As PNG
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant='primary' onClick={() => this.onExport("jpeg")}>
                      As JPEG
                    </Button>
                  </Grid>
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
