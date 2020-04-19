import React, { Component } from "react";
import NodeInformation from "./nodeinfo";
import Tools from "./tools";

class Toolbox extends Component {
  state = {};
  componentDidUpdate() {
    console.log(this.props.visMd);
  }
  render() {
    return (
      <div className="rchild">
        <NodeInformation>Node Information</NodeInformation>
        <Tools
          onFileUpload={this.props.onFileUpload}
          onKeyPressed={this.props.onKeyPressed}
          visMd={this.props.visMd}
          visSNPs={this.props.visSNPs}
        >
          Tools
        </Tools>
      </div>
    );
  }
}

export default Toolbox;
