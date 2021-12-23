import React, {createRef, useCallback, useEffect, useState} from "react";
import * as _ from "lodash";
import * as d3 from "d3";
import * as boxplot from "d3-boxplot";
import Heatmap from "../heatmap";

function HeatmapView(props) {
    const [heightGlobal, setHeightGlobal] = useState(400)
    const [maxWidth, setMaxWidth] = useState(400)

    const SNPprefix = "Pos";
    const container = createRef();
    const handleResize = useCallback(() => {
        setHeightGlobal(container.current.offsetHeight - props.margin.top - props.margin.bottom)
        setMaxWidth(container.current.offsetWidth - props.margin.left - props.margin.right)

    }, [container, props.margin.bottom, props.margin.left, props.margin.right, props.margin.top])
    useEffect(() => {
        if (container.current !== null) {
            handleResize();
        }
        container.current && container.current.addEventListener('resize', handleResize)
    })

    /**
     * Helper function for the extraction of the SNPs from the nodes
     * @param {Object} SNPdata contains the SNP distribution to the nodes
     * @param {Object} labelToID contains the dictionary that distributes the labels
     * @param {Boolean} notSupport Boolean to know which category is meant
     */
    const modifySNPs = useCallback((SNPdata, labelToID, notSupport = false) => {
        let nodes = props.tree.get_nodes();
        let mappedSNPs = SNPdata.map((SNP) => {
            let actualID = labelToID[SNP.node];
            let actualPos = SNP.pos;
            let actualAllele = SNP.allele;
            let node = nodes.find(({tempid}) => {
                return String(tempid) === actualID;
            });

            return props.tree
                .descendants(node)
                .filter(props.tree.is_leafnode)
                .map(({name}) => ({
                    Information: name,
                    [actualPos]: {allele: actualAllele, notsupport: notSupport},
                }));
        });
        let flattenSNPs = _.flatten(mappedSNPs);
        return flattenSNPs;
    }, [props.tree]);
    /**
     *
     * @param {Object} supportSNPs Contains the SNPs label as supporting
     * @param {Object} nonSupportSNPs Similar, but for non-supporting SNPs
     * @param {Array} visualizedSNPs List of the SNPs to visualize
     * @param {Object} IDs Contains the id to label dictinoary
     */
    const preprocessSNPs = useCallback(() => {
        // Include only those that are visualized
        let reducedSupportSNPs = props.snpdata.support.filter(({pos}) => props.visSNPs.includes(pos));
        let reducedNotSupportSNPs = props.snpdata.notsupport.filter(({pos}) => props.visSNPs.includes(pos));
        // Get the correct labelling
        let modifiedSNPData = modifySNPs(reducedSupportSNPs, props.ids.labToNum);
        modifiedSNPData = modifiedSNPData.concat(modifySNPs(reducedNotSupportSNPs, props.ids.labToNum, true));
        // Unify to one entry per ndoe
        let mergedSNPs = modifiedSNPData.reduce((acc, cur) => {
            let obj = acc.find((d) => d.Information === cur.Information) || {};
            let filteredOutput = acc.filter((d) => d.Information !== cur.Information);
            return [...filteredOutput, {...obj, ...cur}];
        }, []);
        return mergedSNPs;
    }, [modifySNPs, props.ids.labToNum, props.snpdata.notsupport, props.snpdata.support, props.visSNPs])
    /**
     *
     * @param {*} v Value -- Data for the group to aggregate
     * @param {*} k Key -- The metadata the group belongs to
     * @param {*} actualClade Object for the actual clade
     */
    const clusterSNPs = (v, k, mdinfo, actualClade) =>
        k === "Information"
            ? actualClade.showname
            : _.countBy(v.map((d) => `${d.allele}${d.notsupport ? "-" : "+"}`));
    /**
     *
     * @param {*} v Value -- Data for the group to aggregate
     * @param {*} k Key -- The metadata the group belongs to
     * @param {*} mdinfo Object containing all metadata info
     * @param {*} actualClade Object for the actual clade
     */
    const clusterMetadata = (v, k, mdinfo, actualClade) =>
        mdinfo[k].type.toLowerCase() === "numerical"
            ? boxplot.boxplotStats(v)
            : ["categorical", "ordinal"].includes(mdinfo[k].type.toLowerCase())
            ? _.countBy(v)
            : actualClade.showname;
    /**
     *
     * Helper function to aggregate the inforamtion of a clade
     *
     * @param {*} data
     * @param {*} actualClades
     * @param {*} clusterMethod
     * @param {*} mdinfo
     */
    const clusterData = useCallback((data, clusterMethod, mdinfo = {}) => {
        let allAggregatedData = [];
        let hiddenLeaves = [];

        let actualClades = props.collapsedClades.sort(
            // sort to avoid the showing of smaller clusters that are already hidden
            (a, b) => b.cladeLeaves.length - a.cladeLeaves.length
        );
        actualClades.forEach((actualClade) => {
            let leavesNames = actualClade.cladeLeaves.map(({name}) => name);
            if (leavesNames.every((n) => hiddenLeaves.includes(n))) {
                return; // this cluster is already included in another one
            }
            hiddenLeaves = hiddenLeaves.concat(leavesNames);
            let metadataToAggregate = data.filter(({Information}) => leavesNames.includes(Information));
            let jointMetadataInformation = _.mergeWith({}, ...metadataToAggregate, (a = [], b) =>
                a.concat(b)
            );
            let aggregatedData = _.mapValues(jointMetadataInformation, (v, k) =>
                clusterMethod(v, k, mdinfo, actualClade)
            );
            aggregatedData["clade"] = true;
            allAggregatedData = [...allAggregatedData, aggregatedData];
        });

        return [...allAggregatedData, ...data];
    }, [props.collapsedClades])
    /**
     * Test if the given node is visible
     *
     * @param {Object} node
     */
    const isVisibleEndNode = useCallback((node) => {
        return (
            (props.tree.is_leafnode(node) || node["own-collapse"]) &&
            d3.layout.phylotree.is_node_visible(node)
        );
    }, [props.tree]);
    let shownNodes = props.tree
        .get_nodes()
        .filter((node) => isVisibleEndNode(node))
        .map((n) => (n["own-collapse"] ? n["show-name"] : n.name));
    let snpData = preprocessSNPs()
    let taxaData = props.taxadata;

    if (props.collapsedClades.length !== 0) {
        snpData = clusterData(
            snpData,
            clusterSNPs
        );
        taxaData = clusterData(
            taxaData,
            clusterMetadata,
            props.mdinfo
        );
    }
    const filteredSNPData = snpData.filter(({Information}) => shownNodes.includes(Information));
    const filteredTaxaData = taxaData.filter(({Information}) => shownNodes.includes(Information));
    const yScale = d3.scale.ordinal().domain(shownNodes).rangeBands([0, heightGlobal]);
    return <div ref={container} style={{width: maxWidth}}>
        <Heatmap
            data={filteredSNPData}
            yScale={yScale}
            x_elements={props.visSNPs}
            mdinfo={props.mdinfo}
            onZoom={props.zoom}
            onDrag={props.lr}
            divID={"heatmap_viz"}
            containerID={"heatmap-container"}
            margin={{top: 0, right: 20, bottom: 0, left: 5}}
            nodes={props.nodes}
            hiddenNodes={props.hiddenNodes}
            collapsedClades={props.collapsedClades}
            selectedNodes={props.selectedNodes}
            snpPerColumn={props.snpPerColumn}
            ids={props.ids}
            visMd={props.visualizedMD}
            SNPcolorScale={_.get(props.mdinfo, "SNP.colorScale", "")}
            snpdata={props.snpdata}
            isSNP={true}
        />
        <Heatmap
             data={filteredTaxaData}
            yScale={yScale}
            x_elements={props.visSNPs}
            mdinfo={props.mdinfo}
            onZoom={props.zoom}
            onDrag={props.lr}
            divID={"md_viz"}
            containerID={"md-container"}
            margin={{top: 0, right: 20, bottom: 0, left: 0}}
            nodes={props.nodes}
            hiddenNodes={props.hiddenNodes}
            collapsedClades={props.collapsedClades}
            selectedNodes={props.selectedNodes}
            ids={props.ids}
            visMd={props.visualizedMD}
            taxadata={props.taxamd}
            isSNP={false}
            createdFilters={props.createdFilters}
        />
    </div>
}

export default HeatmapView;