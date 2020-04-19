import React, { Component } from "react";
import { Accordion, Card, Button, Form } from "react-bootstrap";
class Tools extends Component {
  state = {};
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
                <Form.Control
                  placeholder="Add metadata information"
                  onKeyPress={this.props.onKeyPressed}
                />
                <ul>
                  {this.props.visMd.map((md) => (
                    <li key={md}>{md}</li>
                  ))}
                </ul>
                <Form.Control
                  placeholder="Add SNP position"
                  onKeyPress={this.props.onKeyPressed}
                />
                <ul>
                  {this.props.visSNPs.map((md) => (
                    <li key={md}>{md}</li>
                  ))}
                </ul>
              </div>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }
}

export default Tools;
