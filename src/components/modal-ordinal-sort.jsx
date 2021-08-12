import React, { Component } from "react";
import ModalOwn from "./modal-own";
import { SortableContainer, SortableElement, sortableHandle } from "react-sortable-hoc";
import arrayMove from "array-move";

const DragHandle = sortableHandle(() => <span className='SortableHelper'></span>);

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

  componentDidMount() {
    let ordinalData = this.props.ordinalValues;
    this.setState({ collections: ordinalData });
  }

  render() {
    return (
      <ModalOwn
        id={this.props.ID}
        show={this.props.show}
        onClose={(save) => {
          this.props.handleClose(save, this.state.collections);
          this.setState({ collections: [] });
        }}
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
