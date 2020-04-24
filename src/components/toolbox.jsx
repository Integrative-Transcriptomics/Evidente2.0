import React, { Component } from "react";
import NodeInformation from "./nodeinfo";
import Tools from "./tools";

class Toolbox extends Component {
  state = {};
  componentDidUpdate() {}
  render() {
    return (
      <div className="rchild">
        <NodeInformation>Node Information</NodeInformation>
        <Tools
          availableMDs={this.props.availableMDs}
          availableSNPs={this.props.availableSNPs}
          onFileUpload={this.props.onFileUpload}
          onMDChange={this.props.onMDChange}
          onSNPChange={this.props.onSNPChange}
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
