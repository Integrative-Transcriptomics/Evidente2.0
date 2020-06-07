import React, { Component } from "react";
import { ChromePicker } from "react-color";
import * as $ from "jquery";

class MyColorPicker extends Component {
  state = {
    background: "",
  };
  componentDidMount() {
    this.setState({ background: this.props.element.getAttribute("fill") });
  }
  handleChange = (color) => {
    $(this.props.element).attr("fill", color.hex);
    this.setState({ background: color.hex });
  };
  render() {
    return <ChromePicker color={this.state.background} onChange={this.handleChange}></ChromePicker>;
  }
}

export default MyColorPicker;
