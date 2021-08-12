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
