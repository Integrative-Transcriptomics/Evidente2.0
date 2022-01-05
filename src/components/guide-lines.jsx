
import React, { useEffect } from "react";
import * as d3v5 from "d3v5";

function GuideLines(props) {
    const verticalZoom = d3v5.zoomTransform(d3v5.select("#parent-svg").node());
    let lines = props.yScale.domain().map(d =>
        <line key={d} className={`guides  node-${d}`} x1={0} x2={props.width} y1={props.yScale(d) + props.yScale.rangeBand() / 2}
            y2={props.yScale(d) + props.yScale.rangeBand() / 2}
            stroke={"gray"} strokeDasharray={"10,3"} strokeOpacity={0.25} />)
    return (<g id={"guidelines-container"}
        transform={verticalZoom ? `translate(0, ${verticalZoom.y} )scale(1, ${verticalZoom.k})` : ""}>
        <rect width={props.width} height={props.height} fill={"white"} />
        {lines}
    </g>)
}

export default GuideLines;
