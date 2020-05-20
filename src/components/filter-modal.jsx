import React, { Component } from "react";
import ModalOwn from "./ModalOwn";
import { Slider, Typography } from "@material-ui/core";
import * as _ from "lodash";
import Select, { components } from "react-select";
import zIndex from "@material-ui/core/styles/zIndex";
import OwnSlider from "./own-slider";

const { ValueContainer, Placeholder, Menu, MenuList } = components;

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
  menuPortal: (provided, state) => ({
    ...provided,
    "z-index": 5000,
  }),
};
class FilterModal extends Component {
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={this.props.handleClose}
        title={`Select features to filter`}
      >
        {_.toPairs(this.props.mdinfo).map((arr) => {
          let k = arr[0],
            v = arr[1];
          if (this.props.filterFeatures.includes(k)) {
            let type = v.type.toLowerCase();
            if (type === "numerical") {
              return <OwnSlider name={k} initValue={v.extent} />;
            } else if (["categorical", "ordinal"].includes(type)) {
              return (
                <Select
                  id='metadatashow'
                  options={v.extent.map((d) => ({ value: d, label: d }))}
                  isMulti
                  placeholder={`Visualize ${k}`}
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
