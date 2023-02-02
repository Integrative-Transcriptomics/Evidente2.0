import React, { Component } from "react";
import * as d3 from "d3";
import { isEqual } from "lodash";
import * as d3v5 from "d3v5";

class Labels extends Component {
    state = {};
    selectedLabels = [];
    globalHeight = 0;
    globalWidth = 0;

    shouldComponentUpdate(nextProp, nextState) {
        let oldNodes = this.props.shownNodes;
        let newNodes = nextProp.shownNodes;
        return !isEqual(newNodes, oldNodes)
    }

    componentDidUpdate(prevProps, prevState) {
        let margin_top = this.globalHeight * 0.05;

        d3.select("#adds-margin").attr("transform", `translate(${[0, margin_top]})`);
        let div = d3.select("#tooltip");
        let height = this.globalHeight;
        let props = this.props;
        let shownNodes = props.shownNodes;
        let yScale = d3.scale
            .ordinal()
            .domain(shownNodes)
            .rangeBands([0, height - margin_top]);
        let cellHeight = (height - margin_top) / shownNodes.length;
        let yAxis = d3.svg
            .axis()
            .scale(yScale)
            .tickFormat((d) => d)
            .orient("left");
        let svg = d3.select("#container-labels");
        let ticks = svg
            .select(".own-label.y.axis")
            .call(yAxis)
            .call((g) => g.select(".domain").remove())
            .style("font-size", `${Math.min(cellHeight, 12)}px`)
            .style("cursor", "default")
            .selectAll(".tick");

        ticks
            .selectAll("text")
            .classed("noselect", true)
            .on("mouseover", this.defaultMouseOver)
            .on("mouseout", (d) => {
                d3.selectAll(`.node-${d}.guides`).classed("highlighted-guide", false);
                div.transition().duration(500).style("opacity", 0);
            });

        let textWidth = [];
        let textMargin = 15;
        ticks.selectAll("text").each(function () {
            var thisWidth = this.getComputedTextLength();
            textWidth.push(thisWidth);
        });
        ticks.selectAll("line").remove();
        let guideStyle = {
            stroke: "grey",
            "stroke-dasharray": "10,3",
            "stroke-opacity": 0.25,
        };
        ticks
            .append("line")
            .attr("class", (d) => `guides node-${d}`)
            .attr("x1", (d, i) => -1 * textWidth[i] - textMargin)
            .attr("x2", -2 * this.globalWidth)
            .attr("y1", 0)
            .attr("y2", 0)
            .style(guideStyle);
        ticks
            .append("line")
            .attr("class", (d) => `guides node-${d}`)
            .attr("x1", 0)
            .attr("x2", 2 * this.globalWidth)
            .attr("y1", 0)
            .attr("y2", 0)
            .style(guideStyle);
    }

    componentDidMount() {
        
        let svg = d3
            .select(`#${this.props.divID}`)
            .append("svg")
            .attr("width", this.container.offsetWidth)
            .attr("height", this.container.offsetHeight)
            .attr("id", `display_${this.props.divID}`)
            .attr("transform", `translate(0,0)scale(1)`)
            .append("g")
            .attr("id", "adds-margin")
            .append("g")
            .attr("id", "container-labels")

        svg
            .append("g")
            .attr("class", " own-label y axis")
            .attr("transform", `translate(${[this.container.offsetWidth, 0]})`);
        
        this.globalHeight = this.container.offsetHeight;
        this.globalWidth = this.container.offsetWidth;
        let margin_top = this.globalHeight * 0.05;
        d3.select("#adds-margin").attr("transform", `translate(${[0, margin_top]})`);
        this.container.addEventListener("wheel", function (ev) {
            if (ev.ctrlKey) {
                ev.preventDefault()
            }
        })
        this.selectLabels();
    }

    defaultMouseOver = (d) => {
        let div = d3.select("#tooltip")
        d3.selectAll(`.node-${d}.guides`).classed("highlighted-guide", true);
        div.transition().duration(200).style("opacity", 0.9).style("display", "flex");
        div
            .html(d)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
    }

    selectLabels = ()=>{
        var list =[];

        function brushed() {
            list = [];
            d3v5.select("#container-labels").selectAll("text").each(function(d){     
                var elementBox = this.getBoundingClientRect();
                var rectBox = d3v5.select("rect.selection").node().getBoundingClientRect()
                if(
                    rectBox.left <= elementBox.left &&
                    rectBox.top <= elementBox.top &&
                    rectBox.right >= elementBox.right &&
                    rectBox.bottom >= elementBox.bottom  
                ){
                    d3v5.select(this)
                        .style("fill", "blue")
                        .style("font-weight", 1000)
                    list.push(d);
                    
                }
                else{
                    d3v5.select(this)
                        .style("fill", "black")
                        .style("font-weight", 400)
                }
            });
            //console.log(list)
            this.selectedLabels = list
        }
        function endBrush(){
            if (!d3v5.event.sourceEvent) return; // Only transition after input.
            if (!d3v5.event.selection) return; // Ignore empty selections.
            this.props.onSelection(this.selectedLabels);
            d3v5.select("#selection-group").call(brush.move, null);
            this.props.clearSelection();
        }
        var brush = d3v5.brushY()
                        .on("start brush", brushed.bind(this));
        
        brush.on("end", endBrush.bind(this))
        
        d3v5.select("#container-labels").append('g').attr("id", "selection-group").call(brush);       
    }
    render() {
        return (
            <div id={this.props.divID} className='labels-child' ref={(el) => (this.container = el)}></div>
        );
    }
}

export default Labels;
