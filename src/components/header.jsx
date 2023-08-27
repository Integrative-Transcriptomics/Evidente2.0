<AppBar id=props.id position="fixed" open={open}>
    <Toolbar>
        <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
                marginRight: 5,
                ...(open && { display: 'none' }),
            }}
        >
            <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
            <Evidente></Evidente>          </Typography>
    </Toolbar>
</AppBar>