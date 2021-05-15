import React from "react";
import reactCSS from "reactcss";
import { ChromePicker } from "react-color";
import { color } from "d3v5";

class MyColorPicker extends React.Component {
  constructor(props) {
    super(props);
    let { opacity, ...rest } = color(props.fill);
    this.state = {
      displayColorPicker: false,
      color: {
        ...rest,
        a: opacity,
      },
    };
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  handleChange = (color) => {
    this.setState({ color: color.rgb });
  };

  render() {
    const styles = reactCSS({
      default: {
        color: {
          width: "36px",
          height: "14px",
          borderRadius: "2px",
          background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
        },
        swatch: {
          padding: "5px",
          background: "#fff",
          borderRadius: "1px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
          display: "inline-block",
          cursor: "pointer",
        },
        popover: {
          position: "absolute",
          zIndex: "2",
        },
        cover: {
          position: "fixed",
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
      },
    });

    return (
      <div>
        <div style={styles.swatch} onClick={this.handleClick}>
          <div style={styles.color} id={`colorScale-legendValue-${this.props.passID}`} />
        </div>
        {this.state.displayColorPicker ? (
          <div style={styles.popover}>
            <div style={styles.cover} onClick={this.handleClose} />
            <ChromePicker color={this.state.color} onChange={this.handleChange} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default MyColorPicker;
