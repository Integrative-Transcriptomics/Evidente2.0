import React from "react";

import { Button, Alert, ButtonGroup, } from "react-bootstrap";
import RestoreIcon from '@material-ui/icons/Restore';
import YoutubeSearchedForIcon from '@material-ui/icons/YoutubeSearchedFor';
import GitHubIcon from '@material-ui/icons/GitHub';
import MenuBookIcon from '@material-ui/icons/MenuBook';

export default function HeaderButtons(props) {
    const [error_reset, setErrorReset] = React.useState(false);


    const resetAppInternal = (changeState = true) => {
        if (!error_reset) {
            setErrorReset({ level: "warning" })
        } else {
            if (changeState) {
                props.resetApp();
            }
            setErrorReset(false);

        }

    }
    const styleDiv = { padding: "1em 0 0 0 ", display: "flex", "flexDirection": "column", "justifyContent": "space-between", "alignItems": "center" }

    return (
        <React.Fragment>
            <div style={styleDiv}>
                {error_reset ?
                    <Alert variant="warning">
                        <div style={styleDiv}>
                            This would remove all visualized elements and reset the loaded dataset to its first visualized version. Are you sure you want to proceed?
                            <ButtonGroup style={{ padding: "0.5em 0 0 0" }}>
                                <Button variant="danger" size="sm" onClick={resetAppInternal}> Ok</Button>
                                <Button variant="secondary" size="sm" onClick={() => resetAppInternal(false)}> Close</Button>
                            </ButtonGroup>
                        </div>
                    </Alert>
                    : null
                }

                <ButtonGroup>
                    <Button className="button-with-icon" variant="primary" onClick={props.resetZoom}>
                        <span>Reset Zoom</span><YoutubeSearchedForIcon fontSize="large" />
                    </Button>
                    <Button className="button-with-icon" variant="secondary" href="https://github.com/Integrative-Transcriptomics/Evidente2.0/wiki/User-Manual" target="_blank">
                        <span>User Manual</span><MenuBookIcon fontSize="large" />
                    </Button>

                    <Button className="button-with-icon" variant="secondary" href="https://github.com/Integrative-Transcriptomics/Evidente2.0/" target="_blank">
                        <span>Source Code</span>
                        <GitHubIcon fontSize="large" />

                    </Button>
                    <Button className="button-with-icon" variant="danger" onClick={resetAppInternal}>
                        <span>Reset App</span>
                        <RestoreIcon fontSize="large" />

                    </Button>


                </ButtonGroup>

            </div >
        </React.Fragment >
    );
}