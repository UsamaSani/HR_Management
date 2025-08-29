// src/components/HeroSection.jsx
import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";

const HeroSection = () => {
  return (
    <Box
      sx={{
        height: "90vh",
        background: "linear-gradient(to right, #1e3c72, #2a5298)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 4,
      }}
    >
      <Stack spacing={3} textAlign="center" maxWidth="800px">
        <Typography variant="h3" fontWeight="bold">
          Smart HR Management for Organizations
        </Typography>
        <Typography variant="h6">
          Create organizations, register users, assign tasks, track progress, and manage everything in one place.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" color="primary" size="large">
            Get Started
          </Button>
          <Button variant="outlined" color="inherit" size="large">
            Learn More
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default HeroSection;
