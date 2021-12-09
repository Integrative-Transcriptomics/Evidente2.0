import * as d3 from "d3";
import PropTypes from "prop-types";
import React, {createRef, useCallback, useEffect, useState} from "react";
import Barchart from "./barchart";


function Heatmap(props) {
    /*const handleResize = useCallback(() => {
        setWidthGlobal(container.current.offsetWidth - props.margin.right - props.margin.left)
    }, [container, props.margin.left, props.margin.right])
     useEffect(() => {
         if (container.current !== null) {
             handleResize();
         }
         container.current && container.current.addEventListener('resize', handleResize)
     }, [container, handleResize])*/
    let width=0;
    const minCollapsedCellWidth = 40;
    const minNormalCellWidth = 5;

    let cellWidthMin =
        props.isCollapsed
            ? minCollapsedCellWidth
            : minNormalCellWidth;
    let cellWidthMax = props.maxWidth * (props.isCollapsed ? 0.25 : 0.1);
    let cellWidth = Math.max(
        Math.min(props.maxWidth / props.x_elements.length, cellWidthMax),
        cellWidthMin
    );
    let cellHeight = props.height / props.yScale.domain().length - 1;

    const xScale = d3.scale
        .ordinal()
        .domain(props.x_elements)
        .rangeBands([0, props.x_elements.length * cellWidth]);
    const elements = props.x_elements.map(element =>
        props.data.map(mapping => {
            let returnElem=null;
            if (mapping["clade"]) {
                if (!props.isSNP) {
                    if (props.mdinfo[element].type === "categorical" || props.mdinfo[element].type === "ordinal") {
                        returnElem = <Barchart width={cellWidth} height={cellHeight} data={mapping[element]}
                                               domain={props.mdinfo[element].extent}
                                               colorScale={props.mdinfo[element].colorScale}/>
                        // create bar chart
                    } else if (props.mdinfo[element].type === "numerical") {
                        // create box plot
                    }
                } else {
                    console.log(mapping[element]);
                    // create SNP bar chart
                }
            } else {
                if (Object.keys(mapping).includes(element)) {
                    returnElem = [<rect
                        width={cellWidth}
                        height={cellHeight}
                        fill={props.isSNP ? props.mdinfo.SNP.colorScale(mapping[element].allele) : props.mdinfo[element].colorScale(mapping[element])}
                        stroke={"white"}
                    />, props.isSNP ? mapping[element].notsupport ?
                        <rect fill={"url(#diagonalHatch)"} width={cellWidth} height={cellHeight} stroke="white"
                        /> : null : null]

                }
            }
            return (<g key={mapping["Information"] + mapping[element]}
                       transform={"translate(" + xScale(element) + "," + props.yScale(mapping["Information"]) + ")"}>
                {returnElem}
            </g>)
        })
    )
    return <div style={{overflowX:"scroll",maxWidth:props.maxWidth}}>
        <svg width={widthGlobal} height={props.height}>
            <def>
                <pattern id="diagonalHatch" width={8} height={8}
                         patternUnits="userSpaceOnUse" patternTransform="rotate(60)"/>
                <rect width="4" height="8" transform="translate(0,0)" fill="white"/>
            </def>
            <g transform={"translate(" + props.margin.left + "," + (0.05 * props.height) + ")"}>
                {elements}
            </g>
        </svg>
    </div>
}

Heatmap.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    yScale: PropTypes.func.isRequired,
    margin: PropTypes.object.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    x_elements: PropTypes.arrayOf(PropTypes.string).isRequired,
    maxWidth: PropTypes.number,
    height: PropTypes.number,
}
export default Heatmap;