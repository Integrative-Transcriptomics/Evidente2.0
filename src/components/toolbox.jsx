import React, { Component } from "react";
import NodeInformation from "./nodeinfo";
import Tools from "./tools";

class Toolbox extends Component {
  state = {};
  render() {
    return (
      <div className="rchild">
        <NodeInformation>Node Information</NodeInformation>
        <Tools onFileUpload={this.props.onFileUpload}>Tools</Tools>
      </div>
    );
  }
}

export default Toolbox;
