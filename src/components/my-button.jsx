// File: my-button.jsx
// test component providing a personalized button
// Written by Sophie Pesch 2021

import React, {Component} from "react";
import Button from "react-bootstrap/Button";

class MyButton extends Component{
  
  render(){
    return(
      <Button id= "go-terms" variant= "light" onClick={this.props.onClick} style={{float:'right'}}>
        {this.props.text}
      </Button>
    )
  };
  
}
export default MyButton
