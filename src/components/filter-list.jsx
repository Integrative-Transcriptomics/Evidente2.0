import React, { Component } from "react";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Grid,
} from "@material-ui/core";
import { Button, OverlayTrigger, Popover, Tooltip } from "react-bootstrap";

import * as _ from "lodash";

const popover = (valueFilter) => (
  <Tooltip>
    {/* test */}
    {_.toPairs(valueFilter).map(([key, value]) => {
      return (
        <div>
          <span>{key}</span>
          <span>{value}</span>
        </div>
      );
    })}
  </Tooltip>
);

class FilterList extends Component {
  state = { createdFilters: this.props.createdFilters };
  //   componentDidUpdate() {
  //     this.setState({ activeFilters: this.props.activeFilters });
  //   }

  static getDerivedStateFromProps(props, state) {
    if (!_.isEqual(props.createdFilters, state.createdFilters)) {
      return {
        createdFilters: props.createdFilters,
      };
    }
    return null;
  }
  render() {
    return (
      <React.Fragment>
        <List dense={false}>
          {this.state.createdFilters &&
            this.state.createdFilters.map((value, it) => (
              <ListItem>
                <OverlayTrigger placement='left' overlay={popover(value)}>
                  <ListItemText primary={`Filter ${it + 1}`} />
                </OverlayTrigger>
                <ListItemSecondaryAction>
                  <IconButton
                    edge='end'
                    aria-label='delete'
                    onClick={() => this.props.onDeleteFilter(it)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
        </List>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Button variant='primary' onClick={this.props.onApplyAllFilters}>
              Apply filters
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant='warning' onClick={this.props.onDeleteAllFilters}>
              Remove filters
            </Button>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default FilterList;
