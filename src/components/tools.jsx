import React, {Component} from "react";
import {Accordion, Button, Card, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import Select, {components} from "react-select";
import {keys} from "lodash";
import * as $ from "jquery";
//import { select } from "d3";
import * as d3 from "d3";
import {jsPDF} from "jspdf";
import html2canvas from "html2canvas";


import {Divider, Grid, Typography} from "@material-ui/core";

import HelpIcon from "@material-ui/icons/Help";

import FilterList from "./filter-list";
import VisualizeDataCard from "./visualize-card";

/**
 <<<<<<< HEAD
 =======
 * Helper Function for showing an information text box by hovering over "analyse tree"
 * option in toolbox
 */
const enterMouse = (event) => {
    const div = d3.select("#tooltip");
    div
        .transition()
        .duration(200)
        .style("max-width", "150px")
        .style("opacity", 0.9)
        .style("display", "flex");
    div
        .html("Perform an GO-Enrichment for all clades owning supporting SNPs and receive all significant results")
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
};

const outMouse = () => {
    const div = d3.select("#tooltip");
    div.transition().duration(500).style("opacity", 0).style("max-width", "");
};

/**
 >>>>>>> sophie/main
 * Helper function for the filter tooltip
 * @param {Object} props
 */
const helpTooltip = (props) => {
    return (
        <Tooltip id='help-filter-tooltip' {...props}>
            A filter group defines all the characteristics a certain node should contain in order to be
            shown. Within filter groups, the nodes need to belong to at least one group to be shown.
        </Tooltip>
    );
};
const {ValueContainer, Placeholder} = components;

const CustomValueContainer = ({children, ...props}) => {
    return (
        <ValueContainer {...props}>
            <Placeholder {...props} isFocused={props.isFocused}>
                {props.selectProps.placeholder}
            </Placeholder>
            {React.Children.map(children, (child) =>
                child && child.type !== Placeholder ? child : null
            )}
        </ValueContainer>
    );
};

const selectStates = {
    container: (provided, state) => ({
        ...provided,
        marginTop: 20,
        height: "auto",
    }),
    valueContainer: (provided, state) => ({
        ...provided,
        overflow: "visible",
        height: "auto",
        // maxHeight: "5px",
    }),
    menuList: (provided, state) => ({
        ...provided,
        maxHeight: "150px",
    }),
    placeholder: (provided, state) => ({
        ...provided,
        position: "absolute",
        top: state.hasValue || state.selectProps.inputValue ? -15 : "50%",
        transition: "top 0.1s, font-size 0.1s",
        fontSize: (state.hasValue || state.selectProps.inputValue) && 13,
        "white-space": "nowrap",
        overflow: "hidden",
        "text-overflow": "ellipsis",
    }),
};

/**
 * Contains all components of the tools menu
 *
 */
class Tools extends Component {
    state = {filterValue: [], selectedFeatures: []};

    /**
     * Exports the main SVG to image in pdf document
     *
     */
    async onExport() {
        html2canvas(document.querySelector("#parent-svg")).then(canvas => {
            document.body.appendChild(canvas)
        });

        const input = document.getElementById('parent-svg');
        html2canvas(input)
            .then((canvas) => {
                const imgData = canvas.toDataURL();
                var width = canvas.width;
                var height = canvas.height;
                const pdf = new jsPDF({orientation: 'l', unit: 'px', format: [height, width]});
                pdf.addImage(imgData, 'SVG', 0, 0, height, width);
                pdf.save("download.pdf");
            })
        ;
    }

    /**
     * Creates the labels and values for the correspoinding selecting menu
     * @param {dictionary of metadata} metadata
     */
    getMetadata(metadata) {
        return keys(metadata)
            .filter((d) => !["SNP", "Information"].includes(d))
            .map((d) => {
                return {value: d, label: d};
            });
    }

    /**
     *
     * @param {String} nameOfFilters, name of the selected filters
     */
    onChangeFilter = (value) => {
        this.setState({selectedFeatures: value.map(({value}) => value), filterValue: value});
    };

    /**
     * Updates the file name after selection.
     *
     * @param {Object} FileObject saves all files from the form
     * @param {String} label saves the corresponding label to the file
     */
    onFileChange = ({target}, label) => {
        if (target.files[0] !== undefined) {
            let fileName = target.files[0].name;
            $(target)
                .next(".custom-file-label")
                .css({
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "default",
                    paddingRight: "30%",
                    display: "inline-block",
                })
                .html(`${label}: ${fileName}`);
        }
    };


    onLatestResult = (type) => {
        if (type === "tree") {
            this.props.showLatestResultsTree();
        } else if (type === "clade") {
            this.props.showLatestResults();
        }
    }

    render() {
        return (
            <div>
                <h4>{this.props.children}</h4>
                <Accordion id='tools' defaultActiveKey='0'>
                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='0'
                            id='files-card'
                            className='noselect header-accordion'
                        >
                            Load files
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='0'>
                            <Card.Body>
                                <Form id='fileform' onSubmit={this.props.onFileUpload}>
                                    {[
                                        {id: "nwk", label: "Newick Tree"},
                                        {id: "snp", label: "SNP Table"},
                                        {id: "taxainfo", label: "Taxa metadata"},
                                        // { id: "SNPinfo", label: "SNP metadata" },
                                    ].map(({id, label}) => (
                                        <Form.Group key={id}>
                                            <Form.File
                                                id={id}
                                                label={label}
                                                name={id}
                                                custom
                                                onChange={(el) => this.onFileChange(el, label)}
                                            />
                                        </Form.Group>
                                    ))}
                                    <Button variant='primary' type='submit'>
                                        Submit
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>

                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='1'
                            id='statfiles-card'
                            className='noselect header-accordion'
                        >
                            Load statistic files
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='1'>
                            <Card.Body>
                                <Form id='statfileform' onSubmit={this.props.onStatisticFileUpload}>
                                    {[
                                        {id: "goterm", label: "GO"},
                                        {id: "gff", label: "gff"},
                                        //{ id: "snp_info", label: "SNP info" },
                                    ].map(({id, label}) => (
                                        <Form.Group key={id}>
                                            <Form.File
                                                id={id}
                                                label={label}
                                                name={id}
                                                custom
                                                onChange={(el) => this.onFileChange(el, label)}
                                            />
                                        </Form.Group>
                                    ))}
                                    <Button variant='primary' type='submit'>
                                        Submit
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>

                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='2'
                            id='metadata-card'
                            className='noselect header-accordion'
                        >
                            Visualize data
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='2'>
                            <VisualizeDataCard
                                availableMDs={this.props.availableMDs}
                                availableSNPs={this.props.availableSNPs}
                                visSNPs={this.props.visSNPs}
                                visMd={this.props.visMd}
                                onSNPChange={this.props.onSNPChange}
                                onMDChange={this.props.onMDChange}
                                getMetadata={this.getMetadata}
                            />
                        </Accordion.Collapse>
                    </Card>

                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='3'
                            id='filtering-card'
                            className='noselect header-accordion'
                        >
                            Filter nodes
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='3'>
                            <Card.Body>
                                <Grid container spacing={2} direction='row' alignItems='center'>
                                    <Grid item>
                                        <Typography variant='h6'>Create a filter group with metadata</Typography>
                                    </Grid>
                                    <Grid item>
                                        <OverlayTrigger placement='top' overlay={helpTooltip}>
                                            <HelpIcon style={{display: "flex"}}/>
                                        </OverlayTrigger>
                                    </Grid>
                                </Grid>

                                <Form.Group key='metadatafilter'>
                                    <Select
                                        id='select-filter'
                                        options={this.getMetadata(this.props.availableMDs)}
                                        isMulti
                                        value={this.state.filterValue}
                                        onChange={this.onChangeFilter}
                                        placeholder={"Select metadata for filter group"}
                                        components={{
                                            ValueContainer: CustomValueContainer,
                                        }}
                                        menuPortalTarget={document.getElementById("tools")}
                                        menuPosition={"fixed"}
                                        styles={selectStates}
                                    ></Select>
                                </Form.Group>
                                <Button
                                    variant='primary'
                                    disabled={this.state.selectedFeatures.length === 0}
                                    onClick={() => {
                                        this.setState({filterValue: null, selectedFeatures: []});
                                        this.props.onOpenFilter(this.state.selectedFeatures);
                                    }}
                                >
                                    Create filter group
                                </Button>
                                {this.props.createdFilters.length > 0 && (
                                    <React.Fragment>
                                        <Divider variant='middle' style={{marginTop: "5px", marginBottom: "5px"}}/>
                                        <Typography variant='h6'>Created filter groups</Typography>
                                        <Typography variant='h6' style={{fontWeight: "normal"}}>
                                            Applying following filter would result in {this.props.remainingNodes}{" "}
                                            {this.props.remainingNodes > 1 || this.props.remainingNodes === 0
                                                ? "nodes"
                                                : "node"}
                                        </Typography>

                                        <FilterList
                                            remainingNodes={this.props.remainingNodes}
                                            availableMDs={this.props.availableMDs}
                                            onApplyAllFilters={this.props.onApplyAllFilters}
                                            nameOfFilters={this.props.nameOfFilters}
                                            createdFilters={this.props.createdFilters}
                                            onDeleteFilter={this.props.onDeleteFilter}
                                            onDeleteAllFilters={this.props.onDeleteAllFilters}
                                        />
                                    </React.Fragment>
                                )}
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='4'
                            id='tree-card'
                            className='noselect header-accordion'
                            onMouseOver={enterMouse}
                            onMouseOut={outMouse}
                        >
                            Analyse Tree
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='4'>
                            <Card.Body>
                                <Form id="tree-enrichment">
                                    <Form.Group id="group">
                                        <Form.Label>Significance Level:</Form.Label>
                                        <Form.Control id="sig-level-tree" type="text" defaultValue="0.05"/>
                                    </Form.Group>
                                </Form>
                                <Button variant='primary' onClick={this.props.onStatisticsTreeRequest}>
                                    Find enriched Clades
                                </Button>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>


                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='5'
                            id='result-card'
                            className='noselect header-accordion'
                        >
                            Enrichment Results
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='5'>
                            <Card.Body>
                                <Typography variant='h6' gutterBottom={true}>
                                    Latest Results
                                </Typography>
                                <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
                                    {["Clade", "Tree"].map((typeOfResult) => (
                                        <Grid key={typeOfResult} item>
                                            <Button
                                                variant='primary'
                                                onClick={() => this.onLatestResult(typeOfResult.toLowerCase())}
                                            >
                                                {typeOfResult} analysis
                                            </Button>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>

                    <Card>
                        <Accordion.Toggle
                            as={Card.Header}
                            eventKey='6'
                            id='export-card'
                            className='noselect header-accordion'
                        >
                            Export visualization
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey='6'>
                            <Card.Body>
                                <Typography variant='h6' gutterBottom={true}>
                                    Export visualizations
                                </Typography>
                                <Button variant='primary' onClick={this.onExport}>
                                    Export
                                </Button>
                                {/* <Grid container spacing={2} direction='row' alignItems='center' justify='center'>
        {["PDF", "PNG", "JPEG"].map((typeOfExport) => (
          <Grid key={typeOfExport} item>
            <Button
              variant='primary'
              onClick={() => this.onExport(typeOfExport.toLowerCase())}
              >
              As {typeOfExport}
            </Button>
          </Grid>
        ))}
      </Grid> */}
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                </Accordion>
            </div>
        );
    }
}

export default Tools;
