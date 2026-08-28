import React from "react";
import { Box, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const PenTypingIndicator = ({ userName }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        background: "var(--surface-color, #1f1f1f)",
        width: "fit-content",
        px: 2,
        py: 1,
        borderRadius: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Pen Animation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          animation: "movePen 1s infinite ease-in-out",
          "@keyframes movePen": {
            "0%": {
              transform: "translateX(0px) rotate(-10deg)",
            },
            "50%": {
              transform: "translateX(5px) rotate(10deg)",
            },
            "100%": {
              transform: "translateX(0px) rotate(-10deg)",
            },
          },
        }}
      >
        <EditIcon
          sx={{
            color: "var(--primary-color, #f06292)",
            fontSize: 28,
          }}
        />
      </Box>

      {/* Text */}
      <Typography
        sx={{
          color: "var(--text-color, #ffffff)",
          fontSize: "14px",
          fontWeight: 500,
          letterSpacing: "0.5px",
        }}
      >
        {userName ? `${userName} is writing...` : "Writing..."}
      </Typography>

      {/* Dots Animation */}
      <Box sx={{ display: "flex", gap: "3px" }}>
        {[0, 1, 2].map((item) => (
          <Box
            key={item}
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--primary-color, #f06292)",
              animation: "blink 1.2s infinite",
              animationDelay: `${item * 0.2}s`,
              "@keyframes blink": {
                "0%": {
                  opacity: 0.2,
                  transform: "translateY(0px)",
                },
                "50%": {
                  opacity: 1,
                  transform: "translateY(-3px)",
                },
                "100%": {
                  opacity: 0.2,
                  transform: "translateY(0px)",
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PenTypingIndicator;