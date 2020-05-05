import React, { Component } from "react";
import SNPTable from "./table";
import { Accordion, Card } from "react-bootstrap";
import * as _ from "lodash";

class NodeInformation extends Component {
  state = {};

  createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
  }

  rows = _.times(100, () => this.createData("Frozen yoghurt", 6.0, 24, 4.0));
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
        <div>
          <Accordion>
            <Card>
              <Accordion.Toggle as={Card.Header} eventKey='0'>
                Supporting SNPs
              </Accordion.Toggle>
              <Accordion.Collapse eventKey='0'>
                <Card.Body style={{ maxHeight: 400, overflow: "auto" }}>
                  <SNPTable
                    rows={_.get(this.props.SNPTable, `support.actualNode`, [])}
                    title={"SNPs among the actual node"}
                    onSNPaddition={this.props.onSNPaddition}
                  ></SNPTable>
                  <br />

                  <SNPTable
                    rows={_.get(this.props.SNPTable, `support.descendants`, [])}
                    title={"SNPs among the actual subtree"}
                    onSNPaddition={this.props.onSNPaddition}
                  ></SNPTable>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Accordion.Toggle as={Card.Header} eventKey='1'>
                Non Supporting SNPs
              </Accordion.Toggle>
              <Accordion.Collapse eventKey='1'>
                <Card.Body style={{ maxHeight: 400, overflow: "auto" }}>
                  <SNPTable
                    rows={_.get(this.props.SNPTable, `notsupport.actualNode`, [])}
                    title={"SNPs among the actual node"}
                    onSNPaddition={this.props.onSNPaddition}
                  ></SNPTable>
                  <br />

                  <SNPTable
                    rows={_.get(this.props.SNPTable, `notsupport.descendants`, [])}
                    title={"SNPs among the actual subtree"}
                    onSNPaddition={this.props.onSNPaddition}
                  ></SNPTable>
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
