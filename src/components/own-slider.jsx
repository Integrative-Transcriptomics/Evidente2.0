import React, { Component } from "react";
import { Slider, Typography } from "@material-ui/core";
import * as _ from "lodash";

class OwnSlider extends Component {
  onChange = (ev, newValue, name) => {
    this.props.onChange(name, newValue);
    this.setState({ value: newValue });
  };
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.initValue,
      step: (this.props.initValue[1] - this.props.initValue[0]) / 1000,
    };
  }
  //   componentDidUpdate(prevProp, prevState) {
  //     if (!_.isEqual(prevProp.initValue, this.props.initValue)) {
  //       console.log("test");
  //       console.log(this.props.initValue);
  //       this.setState({ value: this.props.initValue });
  //     }
  //   }
  //   componentDidMount() {
  //     this.setState({ value: this.props.initValue });
  //   }
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
          scale={(x) => x.toFixed(3)}
          valueLabelDisplay='auto'
          onChange={(ev, newValue) => this.onChange(ev, newValue, this.props.name)}
          aria-labelledby='range-slider'
        />
      </div>
    );
  }
}

export default OwnSlider;
