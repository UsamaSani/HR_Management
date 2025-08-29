
import { Box, Typography, Link, Stack, Divider } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#0d47a1",
        color: "white",
        py: 4,
        // mt: 8,
        px: { xs: 2, md: 6 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        {/* Logo or Company Name */}
        <Typography variant="h6" fontWeight="bold">
          SolutionDesk
        </Typography>

        {/* Footer Links */}
        <Stack direction="row" spacing={3}>
          {["Home", "Services", "Projects", "About"].map((text) => (
            <Link
              key={text}
              href="#"
              underline="hover"
              color="inherit"
              sx={{ fontSize: "1rem" }}
            >
              {text}
            </Link>
          ))}
        </Stack>
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 3 }} />

      {/* Copyright */}
      <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
        © {new Date().getFullYear()} SolutionDesk. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
