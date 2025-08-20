import {
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import React, { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import AnimatedTitle from "./AnimatedTitle";
import "@fontsource/pacifico";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Slide from "@mui/material/Slide";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const welcomeAnimation = {
  '@keyframes roseFade': {
    '0%': { color: '#f8bbd0' },
    '50%': { color: '#ec407a' },
    '100%': { color: '#f8bbd0' },
  },
  animation: 'roseFade 2s infinite',
  fontFamily: '"Pacifico", cursive',
  fontWeight: 'bold',
  letterSpacing: 2,
};

function SignInPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotStatus, setForgotStatus] = useState(""); // '', 'checking', 'processing', 'done', 'error'
  const [forgotError, setForgotError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStatus, setResetStatus] = useState(""); // '', 'processing', 'done', 'error'

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handlePasswordChange = (e) => {
    const inputValue = e.target.value;
    const previousMasked = "❤️".repeat(password.length);
    const newMasked = inputValue;

    if (newMasked.length < previousMasked.length) {
      setPassword(password.slice(0, -1));
    } else {
      const addedChar = inputValue.replaceAll("❤️", "")[0] || "";
      setPassword(password + addedChar);
    }
  };

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");

    try {
      const response = await fetch('https://juicee-30ie.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('userId', result.user._id);
        showPopup(true, result.message || "Login successful!");
        setTimeout(() => navigate("/chat"), 2000);
      } else {
        showPopup(false, result.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      showPopup(false, "Server error. Try again.");
    }
  };

  // Open forgot dialog
  const handleForgotOpen = () => {
    setForgotOpen(true);
    setForgotStatus("");
    setForgotMobile("");
    setForgotError("");
  };

  // Handle verify button in forgot dialog
  const handleForgotVerify = async () => {
    setForgotStatus("checking");
    setForgotError("");
    const usernameOrEmail = document.getElementById("email")?.value || "";

    setTimeout(async () => {
      setForgotStatus("processing");
      try {
        // Send both username/email and mobile to backend
        const response = await fetch("https://juicee-30ie.onrender.com/api/forgot-password/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameOrEmail,
            phone: forgotMobile
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setForgotStatus("done");
          setTimeout(() => {
            setForgotOpen(false);
            setResetOpen(true);
          }, 1000);
        } else {
          setForgotStatus("error");
          setForgotError(result.message || "Verification failed.");
        }
      } catch (err) {
        setForgotStatus("error");
        setForgotError("Server error. Try again.");
      }
    }, 1200);
  };

  // Handle password reset
  const handleResetPassword = async () => {
    setResetStatus("processing");
    setTimeout(async () => {
      if (newPassword !== confirmPassword) {
        setResetStatus("error");
        return;
      }
      const usernameOrEmail = document.getElementById("email")?.value || "";
      try {
        // Send username/email, mobile, and new password to backend
        const response = await fetch("https://juicee-30ie.onrender.com/api/forgot-password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameOrEmail,
            phone: forgotMobile,
            newPassword,
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setResetStatus("done");
          setTimeout(() => {
            setResetOpen(false);
            showPopup(true, "Password reset successful!");
          }, 1200);
        } else {
          setResetStatus("error");
        }
      } catch (err) {
        setResetStatus("error");
      }
    }, 1200);
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#fef6f7",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              borderRadius: 3,
              bgcolor: "#fff",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <AnimatedTitle sx={{ mb: 1 }} />
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 2,
                  ...welcomeAnimation,
                }}
              >
                Welcome
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  name="email"
                  label="Username or Email"
                  autoComplete="email"
                  autoFocus
                  sx={{
                    backgroundColor: "#f4dddd",
                    borderRadius: 1,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="text"
                  value={showPassword ? password : "❤️".repeat(password.length)}
                  onChange={handlePasswordChange}
                  sx={{
                    backgroundColor: "#f4dddd",
                    borderRadius: 1,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Grid item xs={12}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    sx={{ color: "#a94442" }}
                    onClick={handleForgotOpen}
                  >
                    Forgot password?
                  </Link>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    bgcolor: "#ef1c1c",
                    "&:hover": { bgcolor: "#cc1818" },
                    borderRadius: 5,
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                >
                  Sign In
                </Button>
              </Box>

              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2">
                    Don't have an account?{" "}
                    <Link component={RouterLink} to="/signup" variant="body2">
                      Sign Up
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Dialog
        open={popup.open}
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: 32,
            left: "44%",
            transform: "translateX(-50%)",
            bgcolor: "#fff",
            borderRadius: 3,
            minWidth: 320,
            boxShadow: 6,
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 2,
          },
        }}
        hideBackdrop
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 0 }}>
          {popup.success ? (
            <CheckCircleRoundedIcon sx={{ color: "#1ecb4f", fontSize: 40 }} />
          ) : (
            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 40 }} />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              color: popup.success ? "#1ecb4f" : "#ef1c1c",
              fontWeight: "bold",
              fontFamily: "Pacifico, cursive",
              letterSpacing: 1,
            }}
          >
            {popup.message}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setForgotOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 350,
            px: 3,
            py: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", ml: 8 }}>
          Forgot Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontWeight: "bold" }}>
            Username/Email: <span style={{ color: "#ef1c1c" }}>{document.getElementById("email")?.value || ""}</span>
          </Typography>
          <TextField
            label="Registered Mobile Number"
            value={forgotMobile}
            onChange={e => setForgotMobile(e.target.value)}
            fullWidth
            sx={{ backgroundColor: "#f4dddd", borderRadius: 1 }}
          />
          {forgotStatus === "checking" && (
            <Typography sx={{ color: "orange", fontWeight: "bold" }}>Checking...</Typography>
          )}
          {forgotStatus === "processing" && (
            <Typography sx={{ color: "blue", fontWeight: "bold" }}>Processing...</Typography>
          )}
          {forgotStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: "#1ecb4f" }} />
              <Typography sx={{ color: "#1ecb4f", fontWeight: "bold" }}>Done!</Typography>
            </Box>
          )}
          {forgotStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold" }}>{forgotError}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ef1c1c", "&:hover": { bgcolor: "#cc1818" }, borderRadius: 5 }}
            onClick={() => setForgotOpen(false)}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#1ecb4f", "&:hover": { bgcolor: "#17a743" }, borderRadius: 5 }}
            onClick={handleForgotVerify}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={resetOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setResetOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 350,
            px: 3,
            py: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", ml: 8 }}>
          Reset Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontWeight: "bold" }}>
            Username/Email: <span style={{ color: "#ef1c1c" }}>{document.getElementById("email")?.value || ""}</span>
          </Typography>
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            sx={{ backgroundColor: "#f4dddd", borderRadius: 1 }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            fullWidth
            sx={{ backgroundColor: "#f4dddd", borderRadius: 1 }}
          />
          {resetStatus === "processing" && (
            <Typography sx={{ color: "blue", fontWeight: "bold" }}>Processing...</Typography>
          )}
          {resetStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: "#1ecb4f" }} />
              <Typography sx={{ color: "#1ecb4f", fontWeight: "bold" }}>Password Reset Successful!</Typography>
            </Box>
          )}
          {resetStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold" }}>
                {newPassword !== confirmPassword ? "Passwords do not match." : "Reset failed."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ef1c1c", "&:hover": { bgcolor: "#cc1818" }, borderRadius: 5 }}
            onClick={() => setResetOpen(false)}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#1ecb4f", "&:hover": { bgcolor: "#17a743" }, borderRadius: 5 }}
            onClick={handleResetPassword}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SignInPage;