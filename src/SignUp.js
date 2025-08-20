import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useMediaQuery,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnimatedTitle from './AnimatedTitle';
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import Slide from "@mui/material/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    idProof: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({}); // Add this

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, [name]: digitsOnly });
    } else if (name === "name") {
      // When full name changes, generate username
      const baseName = value.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const randomNum = Math.floor(10 + Math.random() * 90); // 2 digit number
      setForm({
        ...form,
        name: value,
        username: baseName ? `${baseName}@${randomNum}` : '',
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setForm({ ...form, idProof: e.target.files[0] });
  };

  // Convert image to base64
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result); // base64 string
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({}); // Reset errors

    // Check required fields
    const requiredFields = [
      { key: 'name', label: 'Full Name' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'password', label: 'Password' },
      { key: 'confirmPassword', label: 'Confirm Password' },
      { key: 'gender', label: 'Gender' },
      { key: 'idProof', label: 'Govt ID Proof' }
    ];

    const errors = {};
    requiredFields.forEach(field => {
      if (!form[field.key] || (field.key === 'idProof' && !form.idProof)) {
        errors[field.key] = `Please fill ${field.label}`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      showPopup(false, 'Passwords do not match');
      return;
    }

    // Password rules check
    const allRulesPassed = passwordRules.every(rule => rule.test(form.password));
    if (!allRulesPassed) {
      setFieldErrors({ password: "Password does not meet all requirements" });
      showPopup(false, "Password does not meet all requirements");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'idProof') {
          if (form[key]) formData.append(key, form[key]);
        } else {
          formData.append(key, form[key]);
        }
      });
      formData.append('profileImage', profileImage);

      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showPopup(true, data.message || 'Registered successfully!');
        setTimeout(() => {
          navigate('/signin');
        }, 2000); // Wait for popup to disappear
      } else {
        // If duplicate field error
        if (response.status === 409 && data.field) {
          setFieldErrors({ [data.field]: data.message });
        } else {
          showPopup(false, data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  const passwordRules = [
    {
      label: "8-16 characters",
      test: (v) => v.length >= 8 && v.length <= 16,
    },
    {
      label: "At least one special character (@, /, -, +, etc.)",
      test: (v) => /[@/+\-!#$%^&*(),.?":{}|<>]/.test(v),
    },
    {
      label: "At least one number (0-9)",
      test: (v) => /\d/.test(v),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fff8f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: `'Poppins', sans-serif`,
      }}
    >
      <Box
        sx={{
          width: isMobile ? '90%' : '80%',
          maxWidth: '1200px',
          bgcolor: '#fff',
          p: 4,
          borderRadius: 4,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <AnimatedTitle sx={{ mb: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Sign Up
        </Typography>

        {/* Add Profile Button */}
        <Button
          variant="outlined"
          sx={{
            mb: 2,
            borderColor: '#ec407a',
            color: '#ec407a',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#fce4ec',
              borderColor: '#d81b60',
              color: '#d81b60'
            }
          }}
          onClick={() => setProfileOpen(true)}
        >
          Add Profile
        </Button>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name + Username */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} required sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }} />
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={form.username}
              InputProps={{ readOnly: true }}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
            />
          </Box>

          {/* Email + Phone */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!fieldErrors.phone}
              helperText={fieldErrors.phone}
            />
          </Box>

          {/* Passwords */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ mt: 1, mb: isMobile ? 2 : 0 }}>
            {passwordRules.map((rule, idx) => {
              const passed = rule.test(form.password);
              return (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {passed ? (
                    <CheckCircleRoundedIcon sx={{ color: "#1ecb4f", fontSize: 18 }} />
                  ) : (
                    <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 18 }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: passed ? "#1ecb4f" : "#ef1c1c",
                      fontWeight: passed ? "bold" : "normal",
                    }}
                  >
                    {rule.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Gender + ID Proof */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <FormControl fullWidth required sx={{ textAlign: 'left' }}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{
                height: '56px',
                backgroundColor: '#f8eaea',
                borderColor: '#f8eaea',
                color: '#666',
                '&:hover': {
                  backgroundColor: '#f0e0e0',
                  borderColor: '#f0e0e0',
                },
                textTransform: 'none',
                justifyContent: 'flex-start',
                pl: 2,
              }}
            >
              {form.idProof ? form.idProof.name : 'Upload Govt ID Proof (PDF/PNG/JPEG)'}
              <input type="file" hidden onChange={handleFileChange} accept=".pdf,.png,.jpeg,.jpg" />
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: '#ef1c1c',
              color: '#fff',
              borderRadius: 100,
              py: 1.2,
              fontWeight: 'bold',
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#d91414',
              },
              '&:disabled': {
                backgroundColor: '#cccccc',
                color: '#666666',
              },
            }}
          >
            Register
          </Button>
        </form>

        <Typography sx={{ fontSize: '0.9rem', mt: 2 }}>
          Already have an account?{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: '#000',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => navigate('/signin')}
          >
            Sign In
          </span>
        </Typography>

        {/* Profile Modal */}
        <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: '#ec407a', fontWeight: 700 }}>Add Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <img
                src={profilePreview || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                alt="Profile"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #f8bbd0',
                  marginBottom: 8,
                }}
              />
              <Button
                component="label"
                variant="outlined"
                sx={{
                  backgroundColor: '#f8eaea',
                  borderColor: '#f8eaea',
                  color: '#666',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#f0e0e0',
                    borderColor: '#f0e0e0',
                  },
                }}
              >
                Upload Profile Photo
                <input type="file" accept="image/*" hidden onChange={handleProfileImageChange} />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProfileOpen(false)} sx={{ color: '#ec407a', fontWeight: 600 }}>
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Popup */}
        <Dialog
          open={popup.open}
          TransitionComponent={Transition}
          keepMounted
          PaperProps={{
            sx: {
              position: "fixed",
              bottom: { xs: 16, md: 32 },
              left: { xs: "50%", md: "44%" },
              transform: { xs: "translateX(-50%)", md: "translateX(-50%)" },
              bgcolor: "#fff",
              borderRadius: 3,
              minWidth: 320,
              boxShadow: 6,
              display: "flex",
              alignItems: "center",
              px: 3,
              py: 2,
              zIndex: 1500,
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
      </Box>
    </Box>
  );
}
