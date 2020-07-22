import React, { Component } from "react";
// import SNPTable from "./table";
import { Accordion, Card } from "react-bootstrap";
import * as _ from "lodash";
import * as d3 from "d3";
import VirtualizedTable from "./virtualized-snp-table";

const enterMouse = (event) => {
  const div = d3.select("#tooltip");
  div
    .transition()
    .duration(200)
    .style("max-width", "150px")
    .style("opacity", 0.9)
    .style("display", "flex");
  div
    .html(`Select first a node to show the SNPs among the subtree`)
    .style("left", event.pageX + "px")
    .style("top", event.pageY - 28 + "px");
};

const outMouse = () => {
  const div = d3.select("#tooltip");
  div.transition().duration(500).style("opacity", 0).style("max-width", "");
};

class NodeInformation extends Component {
  state = { showSupport: false, showNonSupport: false };

  static getDerivedStateFromProps(props) {
    const getIfShow = (props, type) =>
      _.get(props, `SNPTable.${type}.actualNode.length`, 0) > 0 ||
      _.get(props, `SNPTable.${type}.descendants.length`, 0) > 0;
    return {
      showSupport: getIfShow(props, "support"),
      showNonSupport: getIfShow(props, "notsupport"),
    };
  }

  render() {
    return (
      <div>
        <h4>{this.props.children}</h4>
        <div>
          <Accordion>
            <Card>
              <Accordion.Toggle
                as={Card.Header}
                eventKey={this.state.showSupport ? "0" : "-1"}
                id='supportingSNPs-header'
                className={`noselect ${
                  this.state.showSupport ? "header-accordion" : "header-accordion-disabled"
                }`}
                onMouseOver={!this.state.showSupport ? enterMouse : undefined}
                onMouseOut={!this.state.showSupport ? outMouse : undefined}
              >
                Supporting SNPs
              </Accordion.Toggle>
              <Accordion.Collapse eventKey='0' id='supportingSNPs-card'>
                <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
                  <VirtualizedTable
                    rows={_.get(this.props.SNPTable, `support.actualNode`, [])}
                    title={"SNPs among the actual node"}
                    type={"node"}
                    onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                    onSNPaddition={this.props.onSNPaddition}
                  ></VirtualizedTable>
                  <VirtualizedTable
                    rows={_.get(this.props.SNPTable, `support.descendants`, [])}
                    title={"SNPs among the actual subtree"}
                    type={"subtree"}
                    onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                    onSNPaddition={this.props.onSNPaddition}
                  ></VirtualizedTable>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Accordion.Toggle
                as={Card.Header}
                eventKey={this.state.showNonSupport ? "1" : "-1"}
                id='nonSupportingSNPs-header'
                className={`noselect ${
                  this.state.showNonSupport ? "header-accordion" : "header-accordion-disabled"
                }`}
                onMouseOver={!this.state.showSupport ? enterMouse : undefined}
                onMouseOut={!this.state.showSupport ? outMouse : undefined}
              >
                Non Supporting SNPs
              </Accordion.Toggle>
              <Accordion.Collapse eventKey='1' id='nonSupportingSNPs-card'>
                <Card.Body style={{ maxHeight: 250, overflow: "auto" }}>
                  <VirtualizedTable
                    rows={_.get(this.props.SNPTable, `notsupport.actualNode`, [])}
                    title={"SNPs among the actual node"}
                    type={"node"}
                    onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                    onSNPaddition={this.props.onSNPaddition}
                  ></VirtualizedTable>

                  <VirtualizedTable
                    rows={_.get(this.props.SNPTable, `notsupport.descendants`, [])}
                    title={"SNPs among the actual subtree"}
                    type={"subtree"}
                    onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                    onSNPaddition={this.props.onSNPaddition}
                  ></VirtualizedTable>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </div>
      </div>
    );
  }
}

export default NodeInformation;
