import React, { Component } from "react";
import { Accordion, Card, Button, Form } from "react-bootstrap";
import Select from "react-select";
import * as _ from "lodash";
import * as $ from "jquery";
class Tools extends Component {
  state = {};
  getMetadata(metadata) {
    return _.keys(metadata)
      .filter((d) => d !== "Information")
      .map((d) => {
        return { value: d, label: d };
      });
  }
  componentDidUpdate() {}
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
        <Accordion defaultActiveKey="0">
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey="0">
              Load Files
            </Accordion.Toggle>
            <Accordion.Collapse eventKey="0">
              <Card.Body>
                <Form id="fileform" onSubmit={this.props.onFileUpload}>
                  {[
                    { id: "nwk", label: "Newick Tree" },
                    { id: "snp", label: "SNP Table" },
                    { id: "taxainfo", label: "Taxa metadata" },
                    { id: "SNPinfo", label: "SNP metadata" },
                    { id: "decoding", label: "Decoding files" },
                  ].map(({ id, label }) => (
                    <Form.Group>
                      <Form.File
                        id={id}
                        label={label}
                        name={id}
                        custom
                        // onChange={(ev) =>
                        //   (document.getElementById(`#${id}`).label =
                        //     ev.target.files[0])
                        // }
                      />
                    </Form.Group>
                  ))}
                  <Button
                    variant="primary"
                    type="submit"
                    // onSubmit={(ev) => this.props.onFileUpload(ev)}
                  >
                    Submit
                  </Button>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey="1">
              View Metadata
            </Accordion.Toggle>
            <Accordion.Collapse eventKey="1">
              <div>
                <Select
                  id="metadatashow"
                  options={this.getMetadata(this.props.availableMDs || [])}
                  onChange={this.props.onMDChange}
                  isMulti
                ></Select>
                <Select
                  id="snpdatashow"
                  options={(this.props.availableSNPs || []).map((d) => {
                    return { value: d, label: d };
                  })}
                  onChange={this.props.onSNPChange}
                  isMulti
                ></Select>
                <br /> <br />
                <br />
              </div>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
