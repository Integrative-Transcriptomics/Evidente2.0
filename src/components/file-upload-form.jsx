import React, { Component } from "react";
import { Alert, Button, Form } from "react-bootstrap";


class FileUploadForm extends Component {
    shouldComponentUpdate(nextProps) {
        return (this.props.loadFiles === nextProps.loadFiles)
    }

    state = {
        visFiles: { nwk: null, snp: null, taxainfo: null },
        statisticsFiles: { goterm: null, gff: null },
        error: false,
        error_reset: false
    };

    loadFile = (files, type, id) => {
        if (files.length > 0) {
            if (type === "statistics") {
                let object = Object.assign({}, this.state.statisticsFiles);
                object[id] = files[0];
                this.setState({ statisticsFiles: object })
            } else {
                let object = Object.assign({}, this.state.visFiles);
                object[id] = files[0];
                this.setState({ visFiles: object })
            }
        }
    }
    submitFiles = () => {
        if ((this.state.statisticsFiles.goterm === null) !== (this.state.statisticsFiles.gff === null)) {
            this.setState({ error: { level: "error", text: ["Please upload both or no statistic files"] } })
        } else {
            if (this.state.error.level === "hint") {
                this.props.loadFiles({
                    statisticsFiles: this.state.statisticsFiles,
                    visFiles: this.state.visFiles,
                })
                this.setState({ error: false })
            } else {
                const errorText = [];
                if ((this.state.statisticsFiles.goterm === null) && (this.state.statisticsFiles.gff === null)) {
                    errorText.push("No statistics can be calculated without statistics files");
                }
                if (errorText.length > 0) {
                    this.setState({ error: { level: "hint", text: errorText } })
                } else {
                    this.props.loadFiles({
                        statisticsFiles: this.state.statisticsFiles,
                        visFiles: this.state.visFiles,
                    })
                }
            }
        }
    }

    render() {
        return (<React.Fragment>
            <Form>
                <Form.Label size={"sm"}>Tree Files</Form.Label>

                {[
                    { id: "nwk", label: "Newick Tree*" },
                    { id: "snp", label: "SNP Table*" },
                    { id: "taxainfo", label: "Taxa metadata" },
                    // { id: "SNPinfo", label: "SNP metadata" },
                ].map(({ id, label }) => {
                    const currentLabel = this.state.visFiles[id] !== null ? label + ": " + this.state.visFiles[id].name : label;
                    return (
                        <Form.Group key={id}>
                            <Form.File
                                label={currentLabel}
                                custom
                                onChange={(e) => this.loadFile(e.target.files, "vis", id)}
                            />
                        </Form.Group>
                    )
                })}
                <Form.Label size={"sm"}>Statistic Files (optional)</Form.Label>
                {[
                    { id: "goterm", label: "GO" },
                    { id: "gff", label: "GFF-file" },
                    //{ id: "snp_info", label: "SNP info" },
                ].map(({ id, label }) => (
                    <Form.Group key={id}>
                        <Form.File
                            label={this.state.statisticsFiles[id] !== null ? label + ": " + this.state.statisticsFiles[id].name : label}
                            custom
                            onChange={(e) => this.loadFile(e.target.files, "statistics", id)}
                        />
                    </Form.Group>
                ))}
                <Form.Text>(*)=required</Form.Text>
            </Form>
            {this.state.error ? <Alert
                variant={this.state.error.level === "error" ? "danger" : "warning"}>{this.state.error.text}</Alert> : null}


            <Button variant='primary' disabled={this.state.visFiles.nwk === null && this.state.visFiles.snp === null} onClick={this.submitFiles}>
                {this.state.error === false ? "Submit" : this.state.error.level === "hint" ? "Submit anyway" : "Submit"}
            </Button>
        </React.Fragment >)
    }
}

export default FileUploadForm;