import React, { Component } from "react";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import Select, { components } from "react-select";
import * as _ from "lodash";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
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

  onChangeFilter = (value) => {
    this.setState({ selectedFeatures: value.map(({ value }) => value), value: value });
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
                      <Form.File id={id} label={label} name={id} custom />
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
        </Accordion>
      </div>
    );
  }
}

export default Tools;
