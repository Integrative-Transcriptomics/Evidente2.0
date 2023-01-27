import React, { Component } from "react";
import * as d3 from "d3";
import { isEqual } from "lodash";

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
        this.container.addEventListener("mousedown", this.initiateSelection)
        this.container.addEventListener("mousemove", this.createSelectionRectangle)
        this.container.addEventListener("mouseup", this.clearSelectionRectangle)
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

    initiateSelection = (e)=>{
        this.selectedLabels = [];
        d3.select("#container-labels").select(".selection").remove();
        d3.select("#container-labels").selectAll("text").each(function(d, i){
            d3.select(this)
                .style("fill", "black")
                .style("font-weight", 400);
        });
        if(e.ctrlKey){
            this.props.onSelection();

            //var svg = document.querySelector("svg");
            var svg = document.getElementById("display_labels_viz")
            var pt = svg.createSVGPoint(); //getboundingclientrect
            pt.x = e.pageX;
            pt.y = e.pageY;
            pt = pt.matrixTransform(svg.getScreenCTM().inverse());
            let guideStyle = {
                "fill":"steelblue",
                "opacity": 0.5,
            } 

            // console.log("mouse: " + pt.y)
            // console.log("tree: "+ this.props.yTreeKoordinate)

            d3.select("#container-labels").append( "rect")
            .attr({
                rx      : 6,
                ry      : 6,
                class   : "selection",
                x       : pt.x,
                y       : pt.y-50-this.props.yTreeKoordinate,
                width   : 0,
                height  : 0
            })
            .style(guideStyle)
            
            // d3.select("#container-labels").selectAll("text")
            //     .on("mouseover", (d) => {
            //         if(!this.selectedLabels.includes(d)){
            //             this.selectedLabels.push(d);
            //         }
            //         else{
            //             var elementToRemove = this.selectedLabels.indexOf(d);
            //             this.selectedLabels.splice(elementToRemove, 1);
            //         }
                    
            //     });
        }
    }
    createSelectionRectangle = (e)=>{
        if(e.ctrlKey){
            var svg = document.getElementById("display_labels_viz")
            var pt = svg.createSVGPoint();
            pt.x = e.pageX;
            pt.y = e.pageY;
            pt = pt.matrixTransform(svg.getScreenCTM().inverse());
        
            var s = d3.select("#container-labels").select("rect.selection");
            if( !s.empty()) { 
                var d = {
                        x       : parseInt( s.attr( "x"), 10),
                        y       : parseInt( s.attr( "y"), 10),
                        width   : parseInt( s.attr( "width"), 10),
                        height  : parseInt( s.attr( "height"), 10)
                    },
                    move = {
                        x : pt.x - d.x,
                        y : pt.y-50- this.props.yTreeKoordinate - d.y
                    }
                ;
                
                if( move.x < 1 || (move.x*2<d.width)) {
                    d.x = pt.x;
                    d.width -= move.x;
                } else {
                    d.width = move.x;       
                }
        
                if( move.y < 1 || (move.y*2<d.height)) {
                    d.y = pt.y-50;
                    d.height -= move.y;
                } else {
                    d.height = move.y;       
                }
            
                s.attr( d);

                var list =[];

                d3.select("#container-labels").selectAll("text").each(function(d, i){
                    
                    var elementBox = this.getBoundingClientRect();
                    var rectBox = d3.select("#container-labels").select("rect").node().getBoundingClientRect()
                    // console.log("rect: " + d3.select("#container-labels").select("rect").node().getBoundingClientRect().bottom)
                    // console.log("label" + i + ": " + elementBox.bottom )
                    if(
                        rectBox.left <= elementBox.left &&
                        rectBox.top <= elementBox.top &&
                        rectBox.right >= elementBox.right &&
                        rectBox.bottom >= elementBox.bottom  
                    ){
                        d3.select(this)
                            .style("fill", "blue")
                            .style("font-weight", 1000)
                        list.push(d);
                        //console.log(list)
                        
                    }
                    else{
                        d3.select(this)
                            .style("fill", "black")
                            .style("font-weight", 400)
                    }
                });
                this.selectedLabels = list
                //console.log(this.selectedLabels)
            }   
        }
    }

    clearSelectionRectangle = ()=>{
        d3.select("#container-labels").select(".selection").remove();
        d3.select("#container-labels").selectAll("text")
            .on("mouseover", this.defaultMouseOver);   
        this.props.onSelection(this.selectedLabels);
        this.props.clearSelection();
    }


    render() {
        return (
            <div id={this.props.divID} className='labels-child' ref={(el) => (this.container = el)}></div>
        );
    }
}

export default Labels;
