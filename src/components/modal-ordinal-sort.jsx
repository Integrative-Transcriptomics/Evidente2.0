import React, { Component } from "react";
import ModalOwn from "./ModalOwn";
import { SortableContainer, SortableElement, sortableHandle } from "react-sortable-hoc";
import arrayMove from "array-move";
import * as _ from "lodash";

const DragHandle = sortableHandle(() => <span className='SortableHelper'></span>);
// const SortableItem = SortableElement(({ value }) => <li>{value}</li>);

const SortableList = SortableContainer(({ collections }) => {
  return (
    <div>
      {collections.map((items, index) => {
        return (
          <React.Fragment key={index}>
            <strong>Metadata Name: {items[0]}</strong>
            <ul>
              {items[1].map((item, i) => (
                <SortableItem key={item} value={`${item}`} index={i} collection={index} />
              ))}
            </ul>
          </React.Fragment>
        );
      })}
    </div>
  );
});

const SortableItem = SortableElement(({ value }) => (
  <li className='SortableItem'>
    <DragHandle />
    {value}
  </li>
));

// const SortableContainer = sortableContainer(({ children }) => {
//   return <ul>{children}</ul>;
// });
class OrdinalModal extends Component {
  state = {
    collections: [],
  };

  onSortEnd = ({ oldIndex, newIndex, collection }) => {
    let collectionIndex = collection;
    let collections = this.state.collections;
    let newCollections = collections;
    let temp = arrayMove(collections[collectionIndex][1], oldIndex, newIndex);
    newCollections[collectionIndex][1] = temp;
    this.setState({ collections: newCollections });
  };

  componentDidUpdate(prevProp, prevState) {
    if (!_.isEqual(prevProp.ordinalValues, this.props.ordinalValues)) {
      this.setState({ collections: this.props.ordinalValues });
    }
  }
  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={() => this.props.handleClose(this.state.collections)}
        title='Select order for ordinal values'
      >
        <SortableList
          className='SortableList'
          collections={this.state.collections}
          onSortEnd={this.onSortEnd}
        />
      </ModalOwn>
    );
  }
}

export default OrdinalModal;
