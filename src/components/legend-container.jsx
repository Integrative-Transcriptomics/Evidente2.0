import React, { Component } from "react";
import Legend from "./legend";

class LegendContainer extends Component {
  state = {};
  render() {
    return (
      <React.Fragment>
        <Legend
          metadataToRows={this.props.metadataToRows}
          addLegend={this.props.addLegend}
          orderChanged={this.props.orderChanged}
          visSNPs={this.props.visSNPs}
          visMd={this.props.visMd}
          availableMDs={this.props.availableMDs}
          onChange={this.props.onColorChange}
        />
      </React.Fragment>
    );
  }
}

export default LegendContainer;
