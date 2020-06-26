import React, { Component } from "react";
import { Slider, Typography, Grid } from "@material-ui/core";

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
      <Grid
        key={`container-slider-${this.props.name}`}
        container
        justify='center'
        alignContent='center'
        spacing={2}
        wrap='nowrap'
      >
        <Grid
          key={`range-slider-title-grid-${this.props.name}`}
          alignItems='center'
          style={{ display: "flex" }}
          item
        >
          <Typography id={`range-slider-${this.props.name}`}>{this.props.name}</Typography>
        </Grid>
        <Grid
          key={`range-slider-slider-grid-${this.props.name}`}
          style={{ display: "flex", width: "80%" }}
          item
        >
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
        </Grid>
      </Grid>

      // <div key={this.props.name}>
      //   <Typography id='range-slider' gutterBottom>
      //     {this.props.name}
      //   </Typography>
      //   <Slider
      //     width='75%'
      //     step={this.state.step}
      //     min={this.props.initValue[0]}
      //     max={this.props.initValue[1]}
      //     value={this.state.value}
      //     scale={(x) => parseFloat(x.toFixed(2))}
      //     valueLabelDisplay='auto'
      //     onChange={(ev, newValue) => this.onChange(ev, newValue, this.props.name)}
      //     aria-labelledby='range-slider'
      //   />
      // </div>
    );
  }
}

export default OwnSlider;
