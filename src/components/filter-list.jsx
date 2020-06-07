import React, { Component } from "react";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Grid,
  Paper,
} from "@material-ui/core";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

import * as _ from "lodash";

const popover = (valueFilter, props) => (
  <Tooltip>
    {_.toPairs(valueFilter).map(([key, value]) => {
      return (
        <Grid key={`container-${key}`} container justify='center' spacing={2}>
          <Grid key={key} item>
            <Paper className='paper-tooltip'>{key}</Paper>
          </Grid>
          <Grid key={value} item>
            <Paper className='paper-tooltip'>
              {_.get(props, `availableMDs["${key}"].type`, undefined) === "numerical"
                ? `From ${value[0].toFixed(3)} To ${value[1].toFixed(3)}`
                : `Includes: [${value.join(", ")}]`}
            </Paper>
          </Grid>
        </Grid>
      );
    })}
  </Tooltip>
);

class FilterList extends Component {
  state = { createdFilters: this.props.createdFilters };

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
              <ListItem key={`filter-${it}`}>
                <OverlayTrigger placement='left' overlay={popover(value, this.props)}>
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
