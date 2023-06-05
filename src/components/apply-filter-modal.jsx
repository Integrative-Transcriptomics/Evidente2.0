import React, {Component} from "react";
import ModalOwn from "./modal-own";
import Select from "react-select";
import HelpIcon from "@material-ui/icons/Help";
import { FormControlLabel, Radio, RadioGroup} from "@material-ui/core";
import { OverlayTrigger,Tooltip } from "react-bootstrap";

const selectStates = {
    container: (provided, state) => ({
        ...provided,
        marginTop: 15,
        height: "auto",
    }),
    valueContainer: (provided, state) => ({
        ...provided,
        overflow: "visible",
        height: "auto",
    }),
    placeholder: (provided, state) => ({
        ...provided,
        position: "absolute",
        top: state.hasValue || state.selectProps.inputValue ? -15 : "50%",
        transition: "top 0.1s, font-size 0.1s",
        fontSize: (state.hasValue || state.selectProps.inputValue) && 13,
    }),
    menuPortal: (provided, state) => ({
        ...provided,
        "z-index": 5000,
    }),
};

class ApplyFilterModal extends Component {      

    state={disabled:true, hide:false, collapseAll:true}

    onChangeSelect = (selectedOption) => {
        if(selectedOption.value === "hide"){
            this.setState({disabled:true, hide:true, collapseAll:false})
        }
        else{
            this.setState({disabled:false, hide:false})
        }     
    };

    onChangeRadio = (change) =>{
        if(change === "collapeAll"){
            this.setState({collapseAll:true})
        }
        else{
            this.setState({collapseAll:false})
        }
    }

    render() {
        return (
            <ModalOwn
                id={this.props.ID}
                show={this.props.show}
                onClose={(save) => {this.props.handleClose(save, this.state.hide, this.state.collapseAll);}}
                buttonName={"Apply Filter"}
                title="Apply filter on nodes"
            >
                <p style={{ textAlign: "justify" }}>
                    <strong>Hide Node: </strong>The leaf node will be hidden. The SNP and metadata statistic will not be visible. 
                </p>
                <p style={{ textAlign: "justify" }}>
                    <strong>Collapse Node: </strong>The parent of the leaf node will be collapsed. As a result the node will not be visible but the SNP and metadata statistic will be.
                </p>
                <Select
                    onChange={(selectedOption) => { this.onChangeSelect(selectedOption)
                    }}
                    options = {[{value: 'hide', label: 'Hide nodes' }, {value: 'collapse', label: 'Collapse nodes' }]}
                    placeholder={`Collapse or Hide Nodes`}
                    menuPortalTarget={document.getElementsByTagName("body")[0]}
                    styles={selectStates}
                ></Select>
                <p style={{ textAlign: "justify" }}>
                </p>
                <RadioGroup row name="use-radio-group" onChange={(e, change)=>{this.onChangeRadio(change)}}>
                    <FormControlLabel value="collapeAll" label="Collapse all nodes" control={<Radio />} disabled={this.state.disabled} />
                    <FormControlLabel value="noConflictCollapse" label="Do not collapse, in case of a conflict" control={<Radio />} disabled={this.state.disabled} />
                    <OverlayTrigger style={{ "z-index": 1 }} placement='top' overlay={
                    <Tooltip id={`tooltip-tree-analysis`}>
                      A conflict occurs when the parent node has child nodes that are not included in the filter. 
                    </Tooltip>
                  }>
                    <HelpIcon />
                  </OverlayTrigger>
                </RadioGroup>
                
            </ModalOwn>
        );
    }
}

export default ApplyFilterModal;
