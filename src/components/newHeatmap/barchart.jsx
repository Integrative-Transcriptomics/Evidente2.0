import * as d3 from "d3";
import React from "react";

function Barchart(props) {
    const margin = {top: 5, left: 5, bot: 5, right: 5}
    const width = props.width-margin.left - margin.right;
    const height = props.height-margin.top - margin.bot;
    let xScale = d3.scale.ordinal().domain(props.domain).rangeBands([0, width]);
    let yScale = d3.scale.linear().domain([0, d3.sum(Object.values(props.data))]).range([height, 0]);
    let barWidth = width / props.domain.length;
    const rects = Object.entries(props.data).map(([key, value]) =>
        <rect key={key} fill={props.colorScale(key)} x={xScale(key)} y={yScale(value)} width={barWidth}
              height={props.height - yScale(value)}/>
    )
    return <g transform={"translate(" + margin.left + "," + margin.top + ")"}>
        {rects}
    </g>
}

export default Barchart;