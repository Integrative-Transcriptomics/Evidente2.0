import React, { Component } from "react";
import { Card } from "react-bootstrap";
import { Typography } from "@material-ui/core";
import { isEqual } from "lodash";

import Select, { components } from "react-select";
const { MenuItem } = components;

function Option(props) {
  // Fix slow rendering of menu item
  const { onMouseMove, onMouseOver, ...newInnerProps } = props.innerProps;

  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component='div'
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...newInnerProps}
      >
      {props.children}
    </MenuItem>
  );
}

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

class VisualizeDataCard extends Component {
  state = {};
  shouldComponentUpdate(nextProp, nextState) {
    if (
      !isEqual(nextProp.availableMDs, this.props.availableMDs) ||
	!isEqual(nextProp.availableSNPs, this.props.availableSNPs) ||
	!isEqual(nextProp.visMd, this.props.visMd) ||
	!isEqual(nextProp.visSNPs, this.props.visSNPs)
    ) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    return (
      <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
        <Typography variant='h6'>Select to visualize</Typography>
        <Select
          id='snpdatashow'
          options={this.props.availableSNPs.map((d) => ({ value: d, label: d }))}
          value={this.props.visSNPs.map((d) => ({ value: d, label: d }))}
          onChange={this.props.onSNPChange}
          placeholder={"Visualize SNPs"}
          isMulti
          components={{
            ValueContainer: CustomValueContainer,
            MenuItem: Option,
          }}
          menuPosition={"fixed"}
          menuPortalTarget={document.getElementById("tools")}
          styles={selectStates}
          ></Select>
        <Select
          id='metadatashow'
          options={this.props.getMetadata(this.props.availableMDs)}
          value={this.props.visMd.map((d) => ({ value: d, label: d }))}
          onChange={this.props.onMDChange}
          isMulti
          placeholder={"Visualize metadata"}
          components={{
            ValueContainer: CustomValueContainer,
          }}
          menuPosition={"fixed"}
          menuPortalTarget={document.getElementById("tools")}
          styles={selectStates}
          ></Select>
      </Card.Body>
    );
  }
}

export default VisualizeDataCard;
