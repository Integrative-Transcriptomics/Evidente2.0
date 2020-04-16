import React, { Component } from "react";

class NodeInformation extends Component {
  state = {};
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
      </div>
    );
  }
}

export default NodeInformation;
