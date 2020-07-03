import React, { Component } from "react";
import NodeInformation from "./nodeinfo";
import Tools from "./tools";

class Toolbox extends Component {
  state = {};
  componentDidUpdate() {}
  render() {
    return (
      <div className='rchild'>
        <NodeInformation
          SNPTable={this.props.SNPTable}
          onSNPaddition={this.props.onSNPaddition}
          onMultipleSNPaddition={this.props.onMultipleSNPaddition}
        >
          Node Information
        </NodeInformation>
        <Tools
          availableMDs={this.props.availableMDs}
          availableSNPs={this.props.availableSNPs}
          onFileUpload={this.props.onFileUpload}
          onMDChange={this.props.onMDChange}
          onSNPChange={this.props.onSNPChange}
          visMd={this.props.visMd}
          visSNPs={this.props.visSNPs}
          orderChanged={this.props.orderChanged}
          onColorChange={this.props.onColorChange}
          onOpenFilter={this.props.onOpenFilter}
          createdFilters={this.props.createdFilters}
          remainingNodes={this.props.remainingNodes}
          nameOfFilters={this.props.nameOfFilters}
          onDeleteFilter={this.props.onDeleteFilter}
          onDeleteAllFilters={this.props.onDeleteAllFilters}
          onApplyAllFilters={this.props.onApplyAllFilters}
        >
          Tools
        </Tools>
      </div>
    );
  }
}

export default Toolbox;
