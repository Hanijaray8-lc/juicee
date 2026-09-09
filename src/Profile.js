import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Snackbar,
  Button,
  Container,
  Paper,
  Avatar,
  useMediaQuery,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TransgenderIcon from '@mui/icons-material/Transgender';
import InfoIcon from '@mui/icons-material/Info';
import BadgeIcon from '@mui/icons-material/Badge';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import API_BASE_URL from './config/apiConfig';

const inputStyle = {
  padding: '14px 16px 14px 44px',
  borderRadius: '14px',
  border: '1.5px solid var(--primary-color, #f8bbd0)',
  backgroundColor: 'var(--surface-color, #fff)',
  color: 'var(--text-color, #000)',
  fontSize: '15px',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  width: '100%',
  boxSizing: 'border-box',
};

const inputFocusStyle = {
  borderColor: '#f06292',
  boxShadow: '0 0 0 3px rgba(240, 98, 146, 0.12)',
};

const validStyle = {
  position: 'absolute',
  right: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '18px',
  zIndex: 2,
};

const invalidStyle = {
  position: 'absolute',
  right: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '18px',
  zIndex: 2,
};

const fieldWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
};

const iconStyle = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#f06292',
  fontSize: '20px',
  zIndex: 2,
  opacity: 0.7,
};

const EditProfile = ({ onBack }) => {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/chat?tab=settings');
    }
  };

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/user/${userId}`)
      .then(res => res.json())
      .then(user => {
        setFullName(user.name || '');
        setUsername(user.username || '');
        setDob(user.dob || '');
        setAbout(user.about || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setGender(user.gender || '');
        setCity(user.city || '');
        setCountry(user.country || '');
        setImage(user.profileImage || null);
        if (user.countryCode) setCountryCode(user.countryCode);
      });
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      const userData = {
        name: fullName,
        username,
        dob,
        about,
        phone,
        email,
        gender,
        city,
        country,
        countryCode,
      };

      // Convert image to base64 if a new image was selected
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          userData.profileImage = reader.result;

          await fetch(`${API_BASE_URL}/api/user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          setImageFile(null);
          setSnackbarOpen(true);
          setTimeout(() => {
            handleBack();
          }, 1500);
        };
        reader.readAsDataURL(imageFile);
      } else {
        // No image change, just save profile data
        await fetch(`${API_BASE_URL}/api/user/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        setSnackbarOpen(true);
        setTimeout(() => {
          handleBack();
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    ...(focusedField === fieldName ? inputFocusStyle : {}),
  });

  return (
    <Box sx={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'var(--background-color, #fff6f8)',
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Fixed AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'var(--surface-color, #ffffff)',
          color: 'var(--text-color, #000000)',
          borderBottom: '1px solid rgba(240, 98, 146, 0.15)',
          boxShadow: '0 2px 8px rgba(240, 98, 146, 0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="back to settings"
            sx={{
              color: '#f06292',
              mr: 1,
              '&:hover': {
                bgcolor: 'rgba(240, 98, 146, 0.08)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
              color: 'var(--text-color, #000000)',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            Edit Profile
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Scrollable Content Area */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        pb: { xs: 18, sm: 6, md: 4 },
        minHeight: 0,
      }}>
        <Container maxWidth="sm" sx={{ pt: { xs: 2, sm: 1.5, md: 1 }, pb: { xs: 2, sm: 1.5, md: 1 }, px: { xs: 1.5, sm: 2 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              pb: { xs: 2, sm: 6, md: 7 },
              borderRadius: { xs: 3, sm: 4 },
              bgcolor: 'var(--surface-color, #fff)',
              boxShadow: '0 4px 24px rgba(240, 98, 146, 0.08)',
              border: '1px solid rgba(240, 98, 146, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 6px 32px rgba(240, 98, 146, 0.12)',
              },
            }}
          >
            {/* Profile Photo Section */}
            <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                  alt="Profile"
                  sx={{
                    width: { xs: 100, sm: 110, md: 120 },
                    height: { xs: 100, sm: 110, md: 120 },
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--primary-color, #f8bbd0)',
                    mx: 'auto',
                    boxShadow: '0 4px 16px rgba(240, 98, 146, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <label htmlFor="image-upload">
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      width: { xs: 32, sm: 36, md: 40 },
                      height: { xs: 32, sm: 36, md: 40 },
                      borderRadius: '50%',
                      bgcolor: '#f06292',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(240, 98, 146, 0.4)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 4px 12px rgba(240, 98, 146, 0.6)',
                      },
                    }}
                  >
                    <CameraAltIcon sx={{ color: '#fff', fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  </Box>
                </label>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
              </Box>
              <Typography
                sx={{
                  mt: { xs: 1, sm: 1.5 },
                  color: '#f06292',
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { opacity: 0.8 },
                }}
                component="label"
                htmlFor="image-upload"
              >
                Change Photo
              </Typography>
            </Box>

            <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: 'rgba(240, 98, 146, 0.15)' }} />

            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5, md: 3 } }}>

              {/* Full Name & Username Row */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: { xs: 1.5, sm: 2 } }}>
                <Box sx={fieldWrapperStyle}>
                  <PersonIcon sx={iconStyle} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={getInputStyle('name')}
                  />
                </Box>
                <Box sx={fieldWrapperStyle}>
                  <BadgeIcon sx={iconStyle} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    style={getInputStyle('username')}
                  />
                </Box>
              </Box>

              {/* Phone Row */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ ...fieldWrapperStyle, flex: 1 }}>
                  <PhoneIcon sx={iconStyle} />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    style={getInputStyle('phone')}
                  />
                  {phone.length === 10 ? (
                    <span style={validStyle}>✅</span>
                  ) : phone.length > 0 ? (
                    <span style={invalidStyle}>❌</span>
                  ) : null}
                </Box>
              </Box>

              {/* Gender */}
              <Box sx={fieldWrapperStyle}>
                <TransgenderIcon sx={iconStyle} />
                <select
                  value={(gender || '').toLowerCase()}
                  onChange={(e) => setGender(e.target.value)}
                  style={getInputStyle('gender')}
                  onFocus={() => setFocusedField('gender')}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </Box>

              {/* Email */}
              <Box sx={fieldWrapperStyle}>
                <EmailIcon sx={iconStyle} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('email')}
                />
                {email.length > 0 && (
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                    <span style={validStyle}>✅</span>
                  ) : (
                    <span style={invalidStyle}>❌</span>
                  )
                )}
              </Box>
            </Box>

            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4, md: 5 } }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#f06292',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: { xs: 2.5, sm: 3 },
                  textTransform: 'none',
                  px: { xs: 4, sm: 6, md: 8 },
                  py: { xs: 1, sm: 1.2, md: 1.3 },
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  boxShadow: '0 4px 16px rgba(240, 98, 146, 0.35)',
                  '&:hover': {
                    bgcolor: '#e91e63',
                    boxShadow: '0 6px 20px rgba(240, 98, 146, 0.45)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Snackbar for Saved message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1800}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: { xs: 1, sm: 2 },
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 1.5, sm: 2 },
          bgcolor: 'var(--surface-color, #fff)',
          borderRadius: { xs: 2.5, sm: 3 },
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 1.5, sm: 2 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid rgba(30, 203, 79, 0.2)',
          animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes slideDown': {
            from: {
              opacity: 0,
              transform: 'translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}>
          <CheckCircleRoundedIcon sx={{ color: "#1ecb4f", fontSize: { xs: 28, sm: 32, md: 36 }, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          <Typography
            variant="subtitle1"
            sx={{
              color: "#1ecb4f",
              fontWeight: "bold",
              fontFamily: "Poppins, sans-serif",
              letterSpacing: 0.5,
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            }}
          >
            Profile Saved!
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;