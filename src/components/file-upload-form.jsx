import React, {Component} from "react";
import {Typography} from "@material-ui/core";
import {Button, Form} from "react-bootstrap";
import Alert from '@material-ui/lab/Alert';


class FileUploadForm extends Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return (this.props.loadFiles === nextProps.loadFiles)
    }

    state = {
        visFiles: {nwk: null, snp: null, taxainfo: null},
        statisticsFiles: {goterm: null, gff: null},
        error: false
    };

    loadFile = (file, type, id) => {
        if (type === "statistics") {
            let object = Object.assign({}, this.state.statisticsFiles);
            object[id] = file;
            this.setState({statisticsFiles: object})
        } else {
            let object = Object.assign({}, this.state.visFiles);
            object[id] = file;
            this.setState({visFiles: object})
        }
    }
    submitFiles = () => {
        if ((this.state.statisticsFiles.goterm === null) !== (this.state.statisticsFiles.gff === null)) {
            this.setState({error: {level: "error", text: ["Please upload both or no statistic files"]}})
        } else {
            if (this.state.error.level === "hint") {
                this.props.loadFiles({
                    statisticsFiles: this.state.statisticsFiles,
                    visFiles: this.state.visFiles,
                })
                this.setState({error: false})
            } else {
                const errorText = [];
                if ((this.state.statisticsFiles.goterm === null) && (this.state.statisticsFiles.gff === null)) {
                    errorText.push("No statistics can be calculated without statistics files");
                }
                if (errorText.length > 0) {
                    this.setState({error: {level: "hint", text: errorText}})
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
            <Typography variant='h6'>Tree Files</Typography>
            <Form>
                {[
                    {id: "nwk", label: "Newick Tree *"},
                    {id: "snp", label: "SNP Table *"},
                    {id: "taxainfo", label: "Taxa metadata"},
                    // { id: "SNPinfo", label: "SNP metadata" },
                ].map(({id, label}) => {
                    const currentLabel=this.state.visFiles[id] !== null ? label + ": " + this.state.visFiles[id].name : label;
                    return (
                        <Form.Group key={id}>
                            <Form.File
                                label={currentLabel}
                                custom
                                onChange={(e) => this.loadFile(e.target.files[0], "vis", id)}
                            />
                        </Form.Group>
                    )
                })}
                <Typography variant='h6'>Statistic Files (optional)</Typography>
                {[
                    {id: "goterm", label: "GO"},
                    {id: "gff", label: "GFF-file"},
                    //{ id: "snp_info", label: "SNP info" },
                ].map(({id, label}) => (
                    <Form.Group key={id}>
                        <Form.File
                            label={this.state.statisticsFiles[id] !== null ? label + ": " + this.state.statisticsFiles[id].name : label}
                            custom
                            onChange={(e) => this.loadFile(e.target.files[0], "statistics", id)}
                        />
                    </Form.Group>
                ))}
                <Typography>(*)=required</Typography>
            </Form>
            {this.state.error ? <Alert
                severity={this.state.error.level === "error" ? "error" : "warning"}>{this.state.error.text}</Alert> : null}
            <Button variant='primary' disabled={this.state.nwk === null} onClick={this.submitFiles}>
                {this.state.error === false ? "Submit" : this.state.error.level === "hint" ? "Submit anyway" : "Submit"}
            </Button>
        </React.Fragment>)
    }
}

export default FileUploadForm;