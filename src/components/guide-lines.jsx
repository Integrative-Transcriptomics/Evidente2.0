
import React from "react";
import * as d3 from "d3";

function GuideLines(props) {
    let transform = d3.select("#zoom-phylotree").attr("transform") || "translate(0,0)scale(1,1)"
    transform = d3.transform(transform)
    let lines = props.yScale.domain().map(d =>
        <line key={d} className={`guides  node-${d}`} x1={0} x2={props.width} y1={props.yScale(d) + props.yScale.rangeBand() / 2}
            y2={props.yScale(d) + props.yScale.rangeBand() / 2}
            stroke={"gray"} strokeDasharray={"10,3"} strokeOpacity={0.25} />)
    return (<g id={"guidelines-container"}
        transform={transform ? `translate(0, ${transform.translate[1]} )scale(1, ${transform.scale[1]})` : ""}>
        <rect width={props.width} height={props.height} fill={"white"} />
        {lines}
    </g>)
}

export default GuideLines;
