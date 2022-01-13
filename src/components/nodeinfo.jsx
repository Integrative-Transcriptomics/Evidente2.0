import React, {Component} from "react";
// import SNPTable from "./table";
import {Alert,Accordion, Card} from "react-bootstrap";
import {get} from "lodash";
import VirtualizedTable from "./virtualized-snp-table";


class NodeInformation extends Component {
    state = {showSupport: false, showNonSupport: false};

    static getDerivedStateFromProps(props) {
        const getIfShow = (props, type) =>
            get(props, `SNPTable.${type}.actualNode.length`, 0) > 0 ||
            get(props, `SNPTable.${type}.descendants.length`, 0) > 0;
        return {
            showSupport: getIfShow(props, "support"),
            showNonSupport: getIfShow(props, "notsupport"),
        };
    }

    render() {
        return (
            <div>
                <h4>{this.props.children}</h4>
                {!this.state.showNonSupport && !this.state.showNonSupport ?
                    <Alert variant={"secondary"}>Select a node in the tree to show the SNPs below a clade</Alert> :
                    <div>
                        <Accordion>
                            <Card>
                                <Accordion.Toggle
                                    as={Card.Header}
                                    style={{backgroundColor:"lightblue"}}
                                    eventKey={this.state.showSupport ? "0" : "-1"}
                                    id='supportingSNPs-header'
                                >
                                    Supporting SNPs
                                </Accordion.Toggle>
                                <Accordion.Collapse eventKey='0' id='supportingSNPs-card'>
                                    <Card.Body style={{maxHeight: 250, overflow: "auto"}}>
                                        <VirtualizedTable
                                            rows={get(this.props.SNPTable, `support.actualNode`, [])}
                                            title={"SNPs in all leaves below the node"}
                                            noSNPtitle={"No SNPs in all leaves below the node"}
                                            onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                                            onSNPaddition={this.props.onSNPaddition}
                                        />
                                        <VirtualizedTable
                                            rows={get(this.props.SNPTable, `support.descendants`, [])}
                                            title={"SNPs in subset of leaves below the node"}
                                            noSNPtitle={"No SNPs in any subset of leaves below the node"}
                                            onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                                            onSNPaddition={this.props.onSNPaddition}
                                        />
                                    </Card.Body>
                                </Accordion.Collapse>
                            </Card>
                            <Card>
                                <Accordion.Toggle
                                    as={Card.Header}
                                    style={{backgroundColor:"lightblue"}}
                                    eventKey={this.state.showNonSupport ? "1" : "-1"}
                                    id='nonSupportingSNPs-header'
                                >
                                    Non Supporting SNPs
                                </Accordion.Toggle>
                                <Accordion.Collapse eventKey='1' id='nonSupportingSNPs-card'>
                                    <Card.Body style={{maxHeight: 250, overflow: "auto"}}>
                                        <VirtualizedTable
                                            rows={get(this.props.SNPTable, `notsupport.actualNode`, [])}
                                            title={"SNPs in all leaves below the node"}
                                            noSNPtitle={"No SNPs in all leaves below the node"}
                                            onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                                            onSNPaddition={this.props.onSNPaddition}
                                        />
                                        <VirtualizedTable
                                            rows={get(this.props.SNPTable, `notsupport.descendants`, [])}
                                            title={"SNPs in subset of leaves below the node"}
                                            noSNPtitle={"No SNPs in any subset of leaves below the node"}
                                            onMultipleSNPaddition={this.props.onMultipleSNPaddition}
                                            onSNPaddition={this.props.onSNPaddition}
                                        />
                                    </Card.Body>
                                </Accordion.Collapse>
                            </Card>
                        </Accordion>
                    </div>
                }
            </div>
        );
    }
}

export default NodeInformation;
