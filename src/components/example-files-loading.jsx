import React from "react";
// import { Alert, Button, Form } from "react-bootstrap";
import { Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import HelpIcon from "@material-ui/icons/Help";




export default function ExampleFilesCard(props) {
    const [exampleID, setExampleID] = React.useState('toy');

    const handleChange = (event) => {
        setExampleID(event.target.value);
    };

    const uploadExample = () => {
        props.handleExampleLoad(exampleID);
    }

    return (
        <React.Fragment>
            <Form id='example-load'>
                <Form.Label size={"sm"}>Select example dataset <OverlayTrigger style={{ "z-index": 1 }} placement='top' overlay={
                    <Tooltip id={`tooltip-example-load`}>
                        A list of preloaded example datasets, either toy example datasets or based on published data. For more information, see the documentation.</Tooltip>}>
                    <HelpIcon />
                </OverlayTrigger></Form.Label>
                <Form.Group id='example-load'>
                    <Form.Control as="select" aria-label="Select example dataset" onChange={handleChange}>
                        <option default value="toy">Toy dataset</option>
                        <option value="lepra">Mycobacterium lepra</option>
                        <option value="syphilis">Treponema pallidum</option>
                    </Form.Control>
                </Form.Group>
            </Form>
            <Button variant='primary'
                onClick={uploadExample}>
                Load example
            </Button>
        </React.Fragment >
    );
}
