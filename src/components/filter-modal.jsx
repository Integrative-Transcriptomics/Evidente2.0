import React, { Component } from "react";
import ModalOwn from "./ModalOwn";
import * as _ from "lodash";
import Select, { components } from "react-select";
import OwnSlider from "./own-slider";
import { Typography, Divider, TextField } from "@material-ui/core";

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
    marginTop: 15,
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
  menuPortal: (provided, state) => ({
    ...provided,
    "z-index": 5000,
  }),
};

class FilterModal extends Component {
  state = { filter: {} };
  onChange = (key, value) => {
    this.setState({ filter: { ...this.state.filter, [key]: value } });
  };
  onChangeName = (event) => {
    this.setState({ name: event.target.value });
  };

  componentDidMount() {
    let features = this.props.filterFeatures;
    let initName = `${features.length > 1 ? "Group" : features[0]} filter`;
    this.nameInput.value = initName;
    this.setState({ name: initName });
  }
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={(save) => {
          this.props.handleClose(save, this.state.filter, this.state.name);
          this.setState({ filter: {} });
        }}
        title={`Select features for the filter`}
      >
        <Typography variant='subtitle1'>
          A filter group defines all the characteristics a certain node should contain in order to
          be shown (AND-junction). Within filter groups, the nodes need to belong to at least one
          group to be shown (OR-junction).
        </Typography>
        <Divider variant='middle' style={{ marginTop: "10px", marginBottom: "10px" }} />

        <TextField
          id='standard-error-helper-text'
          label='Name of filter'
          defaultValue={this.state.name}
          onChange={this.onChangeName}
          // helperText='Incorrect entry.'
          margin='dense'
          variant='outlined'
          inputRef={(el) => (this.nameInput = el)}
        />

        <Typography variant='h6'>Data for filter: </Typography>

        {_.toPairs(this.props.mdinfo).map((arr) => {
          let k = arr[0],
            v = arr[1];
          if (this.props.filterFeatures.includes(k)) {
            let type = v.type.toLowerCase();
            if (type === "numerical") {
              return <OwnSlider key={k} onChange={this.onChange} name={k} initValue={v.extent} />;
            } else if (["categorical", "ordinal"].includes(type)) {
              return (
                <Select
                  key={k}
                  onChange={(e) => {
                    this.onChange(
                      k,
                      e.map((v) => v.value)
                    );
                  }}
                  options={v.extent.map((d) => ({ value: d, label: d }))}
                  isMulti
                  placeholder={`Filter for ${k}`}
                  components={{
                    ValueContainer: CustomValueContainer,
                  }}
                  menuPortalTarget={document.getElementsByTagName("body")[0]}
                  styles={selectStates}
                ></Select>
              );
            }
          }
        })}
      </ModalOwn>
    );
  }
}

export default FilterModal;
