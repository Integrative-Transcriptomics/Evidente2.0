import React, { Component } from "react";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import Select, { components } from "react-select";
import * as _ from "lodash";
import * as $ from "jquery";
import MyColorPicker from "./color-picker";

import { Slider, Typography } from "@material-ui/core";
import Legend from "./legend";

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

// const CustomMultiValue = (props) => {
//   return (
//     <Tooltip title={"Here we could show the legend of the element"}>
//       <span>
//         <MultiValueContainer {...props} />
//       </span>
//     </Tooltip>
//   );
// };

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
  state = {};

  onChangeFilter = (value) => {
    this.setState({ selectedFeatures: value.map(({ value }) => value) });
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
            <Accordion.Toggle as={Card.Header} eventKey='0' id='files-card'>
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
            <Accordion.Toggle as={Card.Header} eventKey='1' id='metadata-card'>
              View Metadata
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='1'>
              <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
                <span>Select to Visualize</span>
                <Select
                  id='snpdatashow'
                  options={(this.props.availableSNPs || []).map((d) => ({ value: d, label: d }))}
                  value={(this.props.visSNPs || []).map((d) => ({ value: d, label: d }))}
                  onChange={this.props.onSNPChange}
                  placeholder={"Visualize SNPs"}
                  isMulti
                  components={{
                    ValueContainer: CustomValueContainer,
                    // MultiValueContainer: CustomMultiValue,
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
                    // MultiValueContainer: CustomMultiValue,
                  }}
                  menuPortalTarget={document.getElementById("tools")}
                  styles={selectStates}
                ></Select>
                <Legend
                  availableMDs={this.props.availableMDs}
                  onChange={this.props.onColorChange}
                ></Legend>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey='2' id='filtering-card'>
              Filter Nodes
            </Accordion.Toggle>
            <Accordion.Collapse eventKey='2'>
              <Card.Body>
                <Form.Group key='metadatafilter'>
                  <Select
                    id='metadatafilter'
                    options={this.getMetadata(this.props.availableMDs || [])}
                    isMulti
                    onChange={this.onChangeFilter}
                    placeholder={"Select Metadata for Filter"}
                    components={{
                      ValueContainer: CustomValueContainer,
                      // MultiValueContainer: CustomMultiValue,
                    }}
                    menuPortalTarget={document.getElementById("tools")}
                    styles={selectStates}
                  ></Select>
                </Form.Group>

                <Button
                  variant='primary'
                  onClick={() => this.props.onOpenFilter(this.state.selectedFeatures)}
                >
                  Create filter
                </Button>

                {/* {_.toPairs(this.props.availableMDs).map((arr) => {
                  let k = arr[0],
                    v = arr[1];
                  let type = v.type.toLowerCase();
                  if (type === "numerical") {
                    return (
                      <div key={k}>
                        <Typography id='range-slider' gutterBottom>
                          {k}
                        </Typography>
                        <Slider
                          value={[20, 40]}
                          valueLabelDisplay='auto'
                          aria-labelledby='range-slider'
                        />
                      </div>
                    );
                  } else if (["categorical", "ordinal"].includes(type)) {
                    return (
                      <Select
                        id='metadatashow'
                        options={v.extent.map((d) => ({ value: d, label: d }))}
                        isMulti
                        placeholder={`Visualize ${k}`}
                        components={{
                          ValueContainer: CustomValueContainer,
                          // MultiValueContainer: CustomMultiValue,
                        }}
                        menuPortalTarget={document.getElementById("tools")}
                        styles={selectStates}
                      ></Select>
                    );
                  }
                })} */}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
