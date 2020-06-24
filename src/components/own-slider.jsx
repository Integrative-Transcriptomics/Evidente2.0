import React, { Component } from "react";
import { Slider, Typography } from "@material-ui/core";

class OwnSlider extends Component {
  onChange = (ev, newValue, name) => {
    this.props.onChange(name, newValue);
    this.setState({ value: newValue });
  };
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.initValue,
      step: parseFloat(((this.props.initValue[1] - this.props.initValue[0]) / 1000).toFixed(3)),
    };
  }
  render() {
    return (
      <div key={this.props.name}>
        <Typography id='range-slider' gutterBottom>
          {this.props.name}
        </Typography>
        <Slider
          step={this.state.step}
          min={this.props.initValue[0]}
          max={this.props.initValue[1]}
          value={this.state.value}
          scale={(x) => parseFloat(x.toFixed(2))}
          valueLabelDisplay='auto'
          onChange={(ev, newValue) => this.onChange(ev, newValue, this.props.name)}
          aria-labelledby='range-slider'
        />
      </div>
    );
  }
}

export default OwnSlider;
