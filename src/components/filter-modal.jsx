import React, { Component } from "react";
import ModalOwn from "./ModalOwn";
import * as _ from "lodash";
import Select, { components } from "react-select";
import OwnSlider from "./own-slider";

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
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={(save) => {
          this.props.handleClose(save, this.state.filter);
          this.setState({ filter: {} });
        }}
        title={`Select features to filter`}
      >
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
