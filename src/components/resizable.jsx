class ResizableModal extends React.Component{
    render(){
        return(
            <Resizable
                defaultSize={{
                width:320,
                height:200,
                }}
            >
            Sample with default size
            </Resizable>
        )
    }
}

export default ResizableModal