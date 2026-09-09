import React from 'react';
import {
  Box,
  Typography,
  Switch,
  IconButton,
  Divider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Snackbar,
  Button,
  TextField,
  DialogActions,
  Tabs,
  Tab,
  Slider,
  Chip,
  Card,
  CardMedia,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PaletteIcon from '@mui/icons-material/Palette';
import TextureIcon from '@mui/icons-material/Texture';
import OpacityIcon from '@mui/icons-material/Opacity';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useSwipeBack from './hooks/useSwipeBack';
import API_BASE_URL from './config/apiConfig';
import MuiAlert from '@mui/material/Alert';
import EditProfile from './Profile';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';
import { UserGuideModal } from './UserGuideModal';
import Help from './Help';
import { App as CapacitorApp } from '@capacitor/app';


// Theme options (keep all your existing theme options here)
const themeOptions = [
  {id: 'light', name: 'Light', description: 'Bright and clear with soft pastels', colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' }, icon: '☀️' },
  {id: 'dark', name: 'Dark', description: 'Sleek and modern with deep tones', colors: { primary: '#f06292', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌙' },
  {id: 'ocean', name: 'Ocean Breeze', description: 'Calming blues and seafoam greens', colors: { primary: '#4db6ac', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🌊' },
  {id: 'sunset', name: 'Sunset Glow', description: 'Warm oranges and pinks for a cozy feel', colors: { primary: '#ff8a65', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  {id: 'forest', name: 'Forest Whisper', description: 'Earthy greens and browns for a natural vibe', colors: { primary: '#81c784', background: '#e8f5e9', surface: '#ffffff', text: '#1b5e20' }, icon: '🌳' },
  {id: 'lavender', name: 'Lavender Dream', description: 'Soft purples and lilacs for a dreamy atmosphere', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💜' },
  {id: 'citrus', name: 'Citrus Zest', description: 'Vibrant yellows and greens for an energetic feel', colors: { primary: '#ffeb3b', background: '#f9fbe7', surface: '#ffffff', text: '#f57f17' }, icon: '🍋' },
  {id: 'midnight', name: 'Midnight Mystery', description: 'Dark purples and blues for a mysterious vibe', colors: { primary: '#9575cd', background: '#ede7f6', surface: '#ffffff', text: '#311b92' }, icon: '🌌' },
  {id: 'rose', name: 'Rose Garden', description: 'Soft pinks and greens for a romantic feel', colors: { primary: '#f48fb1', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🌹' },
  {id: 'autumn', name: 'Autumn Harvest', description: 'Warm reds, oranges, and browns for a cozy fall vibe', colors: { primary: '#ff7043', background: '#fff8e1', surface: '#ffffff', text: '#bf360c' }, icon: '🍂' },
  {id: 'mint', name: 'Mint Fresh', description: 'Cool minty greens and whites for a refreshing feel', colors: { primary: '#4db6ac', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🍃' },
  {id: 'grape', name: 'Grape Escape', description: 'Rich purples and soft lavenders for a sweet vibe', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '🍇' },
  {id: 'sunrise', name: 'Sunrise Bliss', description: 'Soft pinks and oranges for a peaceful morning feel', colors: { primary: '#ff8a65', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  {id: 'steel', name: 'Steel Blue', description: 'Cool steel blues and grays for a modern industrial vibe', colors: { primary: '#90a4ae', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🔩' },
  {id: 'peach', name: 'Peachy Keen', description: 'Soft peaches and creams for a sweet and cozy feel', colors: { primary: '#ffab91', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🍑' },
  {id: 'slate', name: 'Slate Gray', description: 'Neutral grays with a hint of blue for a sophisticated look', colors: { primary: '#90a4ae', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🪨' },
  {id: 'coral', name: 'Coral Reef', description: 'Vibrant corals and teals for a lively ocean vibe', colors: { primary: '#ff7043', background: '#e0f7fa', surface: '#ffffff', text: '#004d40' }, icon: '🪸' },
  {id: 'orchid', name: 'Orchid Bloom', description: 'Soft purples and pinks for a delicate floral feel', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💐' },
  {id: 'cocoa', name: 'Cocoa Delight', description: 'Warm browns and creams for a cozy chocolate vibe', colors: { primary: '#6d4c41', background: '#efebe9', surface: '#ffffff', text: '#3e2723' }, icon: '🍫' },
  {id: 'sky', name: 'Sky High', description: 'Bright blues and whites for a fresh and airy feel', colors: { primary: '#64b5f6', background: '#e3f2fd', surface: '#ffffff', text: '#01579b' }, icon: '☁️' },
  {id: 'berry', name: 'Berry Bliss', description: 'Rich berry tones and soft pinks for a sweet and vibrant vibe', colors: { primary: '#f06292', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🍓' }
];

// Gradient Themes (keep all your existing gradient themes)
const gradientThemes = [
  {id: 'sunset-gradient', name: 'Sunset Gradient', description: 'Warm gradient blending oranges and pinks', colors: { primary: 'linear-gradient(135deg, #ff8a65, #ff7043)', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  {id: 'ocean-gradient', name: 'Ocean Gradient', description: 'Cool gradient blending blues and teals', colors: { primary: 'linear-gradient(135deg, #4db6ac, #26a69a)', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🌊' },
  {id: 'lavender-gradient', name: 'Lavender Gradient', description: 'Soft gradient blending purples and lilacs', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💜' },
  {id: 'citrus-gradient', name: 'Citrus Gradient', description: 'Vibrant gradient blending yellows and greens', colors: { primary: 'linear-gradient(135deg, #ffeb3b, #cddc39)', background: '#f9fbe7', surface: '#ffffff', text: '#f57f17' }, icon: '🍋' },
  {id: 'midnight-gradient', name: 'Midnight Gradient', description: 'Dark gradient blending purples and blues', colors: { primary: 'linear-gradient(135deg, #9575cd, #7e57c2)', background: '#ede7f6', surface: '#ffffff', text: '#311b92' }, icon: '🌌' },
  {id: 'rose-gradient', name: 'Rose Gradient', description: 'Soft gradient blending pinks and greens', colors: { primary: 'linear-gradient(135deg, #f48fb1, #f06292)', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🌹' },
  {id: 'steel-gradient', name: 'Steel Gradient', description: 'Cool gradient blending steel blues and grays', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🔩' },
  {id: 'coral-gradient', name: 'Coral Gradient', description: 'Vibrant gradient blending corals and teals', colors: { primary: 'linear-gradient(135deg, #ff7043, #26a69a)', background: '#e0f7fa', surface: '#ffffff', text: '#004d40' }, icon: '🪸' },
  {id: 'orchid-gradient', name: 'Orchid Gradient', description: 'Soft gradient blending purples and pinks', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💐' },
  {id: 'cocoa-gradient', name: 'Cocoa Gradient', description: 'Warm gradient blending browns and creams', colors: { primary: 'linear-gradient(135deg, #6d4c41, #5d4037)', background: '#efebe9', surface: '#ffffff', text: '#3e2723' }, icon: '🍫' },
  {id: 'sky-gradient', name: 'Sky Gradient', description: 'Bright gradient blending blues and whites', colors: { primary: 'linear-gradient(135deg, #64b5f6, #e3f2fd)', background: '#e3f2fd', surface: '#ffffff', text: '#01579b' }, icon: '☁️' },
  {id: 'berry-gradient', name: 'Berry Gradient', description: 'Rich gradient blending berry tones and soft pinks', colors: { primary: 'linear-gradient(135deg, #f06292, #f48fb1)', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🍓' },
  {id: 'peach-gradient', name: 'Peach Gradient', description: 'Soft gradient blending peaches and creams', colors: { primary: 'linear-gradient(135deg, #ffab91, #ff7043)', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🍑' },
  {id: 'slate-gradient', name: 'Slate Gradient', description: 'Neutral gradient blending grays with a hint of blue', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🪨' }
];

// Dark Themes (keep all your existing dark themes)
const darkThemes = [
  {id: 'dark-theme', name: 'Dark', description: 'Sleek and modern with deep tones', colors: { primary: '#f06292', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌙' },
  {id: 'midnight-dark', name: 'Midnight Mystery', description: 'Dark purples and blues for a mysterious vibe', colors: { primary: '#9575cd', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌌' },
  {id: 'steel-dark', name: 'Steel Blue', description: 'Cool steel blues and grays for a modern industrial vibe', colors: { primary: '#90a4ae', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🔩' },
  {id: 'cocoa-dark', name: 'Cocoa Delight', description: 'Warm browns and creams for a cozy chocolate vibe', colors: { primary: '#6d4c41', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🍫' },
  {id: 'sky-dark', name: 'Sky High', description: 'Bright blues and whites for a fresh and airy feel', colors: { primary: '#64b5f6', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '☁️' },
  {id: 'midnight-gradient-dark', name: 'Midnight Gradient', description: 'Dark gradient blending purples and blues', colors: { primary: 'linear-gradient(135deg, #9575cd, #7e57c2)', background: '#ede7f6', surface: '#ffffff', text: '#311b92' }, icon: '🌌' },
  {id: 'steel-gradient-dark', name: 'Steel Gradient', description: 'Cool gradient blending steel blues and grays', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🔩' },
  {id: 'coral-gradient-dark', name: 'Coral Gradient', description: 'Vibrant gradient blending corals and teals', colors: { primary: 'linear-gradient(135deg, #ff7043, #26a69a)', background: '#e0f7fa', surface: '#ffffff', text: '#004d40' }, icon: '🪸' },
  {id: 'orchid-gradient-dark', name: 'Orchid Gradient', description: 'Soft gradient blending purples and pinks', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💐' },
  {id: 'cocoa-gradient-dark', name: 'Cocoa Gradient', description: 'Warm gradient blending browns and creams', colors: { primary: 'linear-gradient(135deg, #6d4c41, #5d4037)', background: '#efebe9', surface: '#ffffff', text: '#3e2723' }, icon: '🍫' },
  {id: 'sky-gradient-dark', name: 'Sky Gradient', description: 'Bright gradient blending blues and whites', colors: { primary: 'linear-gradient(135deg, #64b5f6, #e3f2fd)', background: '#e3f2fd', surface: '#ffffff', text: '#01579b' }, icon: '☁️' },
  {id: 'berry-gradient-dark', name: 'Berry Gradient', description: 'Rich gradient blending berry tones and soft pinks', colors: { primary: 'linear-gradient(135deg, #f06292, #f48fb1)', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🍓' },
  {id: 'sunset-gradient-dark', name: 'Sunset Gradient', description: 'Warm gradient blending oranges and pinks', colors: { primary: 'linear-gradient(135deg, #ff8a65, #ff7043)', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  {id: 'ocean-gradient-dark', name: 'Ocean Gradient', description: 'Cool gradient blending blues and teals', colors: { primary: 'linear-gradient(135deg, #4db6ac, #26a69a)', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🌊' },
  {id: 'lavender-gradient-dark', name: 'Lavender Gradient', description: 'Soft gradient blending purples and lilacs', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💜' },
  {id: 'citrus-gradient-dark', name: 'Citrus Gradient', description: 'Vibrant gradient blending yellows and greens', colors: { primary: 'linear-gradient(135deg, #ffeb3b, #cddc39)', background: '#f9fbe7', surface: '#ffffff', text: '#f57f17' }, icon: '🍋' }
];


// Background Patterns (using pure CSS gradient patterns)
const backgroundPatterns = [
  { 
    id: 'dots', 
    name: 'Polka Dots', 
    icon: '💬',
    pattern: 'radial-gradient(var(--pattern-color, rgba(0,0,0,0.12)) 1.5px, transparent 1.5px)', 
    size: '20px 20px',
    category: 'patterns'
  },
  { 
    id: 'lines', 
    name: 'Stripes', 
    icon: '📊',
    pattern: 'repeating-linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.08)) 0px, var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px, transparent 12px)', 
    size: '12px 12px',
    category: 'patterns'
  },  
  { 
    id: 'grid', 
    name: 'Graph Grid', 
    icon: '📐',
    pattern: 'linear-gradient(var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px)', 
    size: '20px 20px',
    category: 'patterns'
  }, 
  { 
    id: 'chevron', 
    name: 'Chevron Waves', 
    icon: '🌊',
    pattern: 'linear-gradient(135deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(225deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(315deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%)', 
    size: '30px 30px',
    category: 'patterns'
  },
  { 
    id: 'geometric', 
    name: 'Mosaic Box', 
    icon: '🧱',
    pattern: 'linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.05)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.05)) 75%), linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.05)) 25%, var(--background-color, #fff) 25%, var(--background-color, #fff) 75%, var(--pattern-color, rgba(0,0,0,0.05)) 75%)', 
    size: '40px 40px',
    category: 'patterns'
  },
  { 
    id: 'bubbles', 
    name: 'Bubble Rings', 
    icon: '🫧',
    pattern: 'radial-gradient(circle, transparent 20%, var(--pattern-color, rgba(0,0,0,0.06)) 20%, var(--pattern-color, rgba(0,0,0,0.06)) 22%, transparent 22%)', 
    size: '30px 30px',
    category: 'patterns'
  },
  { 
    id: 'tech', 
    name: 'Cyber Mesh', 
    icon: '💻',
    pattern: 'linear-gradient(0deg, transparent 24%, var(--pattern-color, rgba(0,0,0,0.06)) 25%, var(--pattern-color, rgba(0,0,0,0.06)) 26%, transparent 27%, transparent 74%, var(--pattern-color, rgba(0,0,0,0.06)) 75%, var(--pattern-color, rgba(0,0,0,0.06)) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, var(--pattern-color, rgba(0,0,0,0.06)) 25%, var(--pattern-color, rgba(0,0,0,0.06)) 26%, transparent 27%, transparent 74%, var(--pattern-color, rgba(0,0,0,0.06)) 75%, var(--pattern-color, rgba(0,0,0,0.06)) 76%, transparent 77%)', 
    size: '60px 60px',
    category: 'patterns'
  },
  { 
    id: 'none', 
    name: 'No Pattern', 
    icon: '🚫',
    pattern: 'none', 
    size: '0 0',
    category: 'patterns'
  }
];

// Image Backgrounds (premium CSS gradients acting as wallpapers)
const imageBackgrounds = [
  { id: 'sunset', name: 'Sunset Glow', pattern: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)', size: 'cover', icon: '🌅', isWallpaper: true, category: 'wallpapers' },
  { id: 'aurora', name: 'Aurora Sky', pattern: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', size: 'cover', icon: '🌌', isWallpaper: true, category: 'wallpapers' },
  { id: 'magic', name: 'Magic Purple', pattern: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', size: 'cover', icon: '🔮', isWallpaper: true, category: 'wallpapers' },
  { id: 'mint', name: 'Fresh Mint', pattern: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)', size: 'cover', icon: '🍃', isWallpaper: true, category: 'wallpapers' },
  { id: 'ocean', name: 'Ocean Wave', pattern: 'linear-gradient(135deg, #2ab1e4 0%, #152585 100%)', size: 'cover', icon: '🌊', isWallpaper: true, category: 'wallpapers' },
  { id: 'darkness', name: 'Elegance Dark', pattern: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)', size: 'cover', icon: '🖤', isWallpaper: true, category: 'wallpapers' },
  { id: 'peach', name: 'Sweet Peach', pattern: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', size: 'cover', icon: '🍑', isWallpaper: true, category: 'wallpapers' },
  { id: 'none_image', name: 'No Image', pattern: 'none', size: '0 0', icon: '🚫', isWallpaper: true, category: 'wallpapers' }
];

// Combine all patterns
const allPatterns = [...backgroundPatterns, ...imageBackgrounds];
const patternMap = {};
allPatterns.forEach(pattern => {
  patternMap[pattern.id] = pattern;
});

// Pattern Categories
const patternCategories = [
  { id: 'all', name: 'All' },
  { id: 'patterns', name: 'Patterns' },
  { id: 'wallpapers', name: 'Gradients' },
  { id: 'custom', name: 'My Uploads' }
];

// Theme Categories
const themeCategories = [
  { id: 'solid', name: 'Solid Colors', themes: themeOptions },
  { id: 'gradient', name: 'Gradients', themes: gradientThemes },
  { id: 'dark', name: 'Dark Themes', themes: darkThemes },
  { id: 'custom', name: 'My Themes', themes: [] } // Placeholder for user-created themes
];

const settingsSections = [
  {
    title: 'Appearance',
    items: [
      {
        label: 'Theme Colors',
        desc: 'Choose your preferred color theme',
        type: 'theme-selector'
      },
      {
        label: 'Background Pattern',
        desc: 'Add subtle background patterns or upload your own wallpaper',
        type: 'pattern-selector'
      },
      {
        label: 'Pattern Opacity',
        desc: 'Adjust pattern visibility intensity',
        type: 'opacity-slider'
      }
    ]
  },
  {
    title: 'Privacy',
    items: [
      {
        label: 'Profile Visibility',
        desc: 'When Private, your account won\'t appear in other users\' suggestions.',
        type: 'switch',
        key: 'profileVisible'
      },
      {
        label: 'Blocked Users',
        desc: 'Manage blocked users and prevent unwanted interactions.',
        type: 'link'
      },
      {
        label: 'Contact Gestures',
        desc: 'Draw custom signs to instantly open contact chats.',
        type: 'link'
      },
    ]
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Edit Profile',
        desc: 'Update your profile picture, name, and bio.',
        type: 'link'
      },
    ]
  },
  {
    title: 'Help & Onboarding',
    items: [
      {
        label: 'Help & Support',
        desc: 'Report an issue or contact support via WhatsApp',
        type: 'link'
      },
      {
        label: 'App Tutorial & User Guide',
        desc: 'Re-read the 9-step tutorial guide anytime.',
        type: 'link'
      }
    ]
  }
];

const initialSwitchState = {
  profileVisible: true,
  messageEncryption: false
};

const Settings = ({ onBack }) => {
  useSwipeBack();
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [showTutorialGuide, setShowTutorialGuide] = React.useState(false);
  const [switchState, setSwitchState] = React.useState(initialSwitchState);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteInput, setDeleteInput] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false);
  const [patternDialogOpen, setPatternDialogOpen] = React.useState(false);
  const [opacityDialogOpen, setOpacityDialogOpen] = React.useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState('light');
  const [selectedPattern, setSelectedPattern] = React.useState('none');
  const [patternOpacity, setPatternOpacity] = React.useState(5);
  const [themeTab, setThemeTab] = React.useState('solid');
  const [patternTab, setPatternTab] = React.useState('all');
  const [customImages, setCustomImages] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [confirmPrivacyDialogOpen, setConfirmPrivacyDialogOpen] = React.useState(false);
  const [pendingProfileVisible, setPendingProfileVisible] = React.useState(null);
  const [privacyUpdating, setPrivacyUpdating] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [cropAspectRatio, setCropAspectRatio] = React.useState(9 / 16);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const fileInputRef = React.useRef(null);
  const rawApiBase = API_BASE_URL;
  const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

  // Load custom images from localStorage on mount
  React.useEffect(() => {
    const savedCustomImages = localStorage.getItem('customWallpapers');
    if (savedCustomImages) {
      setCustomImages(JSON.parse(savedCustomImages));
    }

    // Load current settings
    const DEFAULT_THEME = {
      id: 'light',
      name: 'Light',
      description: 'Bright and clear with soft pastels',
      colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' },
      icon: '☀️'
    };
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      const themeData = JSON.parse(savedTheme);
      setSelectedTheme(themeData.id);
      applyTheme(themeData);
    } else {
      setSelectedTheme('light');
      localStorage.setItem('appTheme', JSON.stringify(DEFAULT_THEME));
      applyTheme(DEFAULT_THEME);
    }

    const savedPattern = localStorage.getItem('appPattern');
    if (savedPattern) {
      const patternData = JSON.parse(savedPattern);
      setSelectedPattern(patternData.id);
      applyPattern(patternData);
    }

    const savedOpacity = localStorage.getItem('patternOpacity');
    let isWall = false;
    if (savedPattern) {
      try {
        const patternData = JSON.parse(savedPattern);
        isWall = patternData.isWallpaper || patternData.type === 'custom-image' || patternData.type === 'image' ||
                 ['sunset', 'aurora', 'magic', 'mint', 'ocean', 'darkness', 'peach'].includes(patternData.id);
      } catch (e) {}
    }
    const defaultOpacity = savedOpacity !== null ? parseInt(savedOpacity) : (isWall ? 100 : 5);
    setPatternOpacity(defaultOpacity);
    applyOpacity(defaultOpacity);

    const savedSwitchState = localStorage.getItem('settingsSwitchState');
    if (savedSwitchState) {
      setSwitchState(JSON.parse(savedSwitchState));
    }

    // Fetch user settings from backend
    if (userId) {
      fetch(`${API_BASE}/api/user/${userId}`)
        .then(res => res.json())
        .then(user => {
          setSwitchState(prev => ({
            ...prev,
            profileVisible: user.profileVisible !== false,
            messageEncryption: user.messageEncryption === true
          }));
        });
    }
  }, [userId]);

  // Apply theme to entire app
  const applyTheme = (themeData) => {
    if (!themeData) return;

    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeData.colors.primary);
    root.style.setProperty('--background-color', themeData.colors.background);
    root.style.setProperty('--surface-color', themeData.colors.surface);
    root.style.setProperty('--text-color', themeData.colors.text);

    // Calculate background color luminance to determine if theme is dark or light
    let isDark = false;
    const bgCol = themeData.colors.background;
    if (bgCol && bgCol.startsWith('#')) {
      try {
        const hex = bgCol.replace('#', '').trim();
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        isDark = brightness < 128;
      } catch (e) {
        const themeIdStr = (themeData.id || '').toLowerCase();
        isDark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
      }
    } else {
      const themeIdStr = (themeData.id || '').toLowerCase();
      isDark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
    }
    root.style.setProperty('--pattern-color', isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeData.colors.primary);
    }
  };

  // Apply background pattern
  const applyPattern = (patternData) => {
    const root = document.documentElement;
    const isWallpaper = patternData.isWallpaper || patternData.type === 'custom-image' || patternData.type === 'image' ||
                        ['sunset', 'aurora', 'magic', 'mint', 'ocean', 'darkness', 'peach'].includes(patternData.id);

    if (patternData.id === 'none' || patternData.id === 'none_image') {
      root.style.setProperty('--background-pattern', 'none');
      root.style.setProperty('--pattern-repeat', 'repeat');
      root.style.setProperty('--pattern-position', 'center');
      root.style.setProperty('--pattern-opacity', '0');
    } else if (patternData.type === 'custom-image') {
      root.style.setProperty('--background-pattern', `url("${patternData.url}")`);
      root.style.setProperty('--pattern-size', patternData.size || 'cover');
      root.style.setProperty('--pattern-repeat', 'no-repeat');
      root.style.setProperty('--pattern-position', 'center');
      
      const savedOpacity = localStorage.getItem('patternOpacity');
      const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 100;
      setPatternOpacity(opacityVal);
      root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
    } else if (isWallpaper) {
      root.style.setProperty('--background-pattern', patternData.pattern);
      root.style.setProperty('--pattern-size', patternData.size || 'cover');
      root.style.setProperty('--pattern-repeat', 'no-repeat');
      root.style.setProperty('--pattern-position', 'center');
      
      const savedOpacity = localStorage.getItem('patternOpacity');
      const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 100;
      setPatternOpacity(opacityVal);
      root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
    } else {
      root.style.setProperty('--background-pattern', patternData.pattern);
      root.style.setProperty('--pattern-size', patternData.size || '20px 20px');
      root.style.setProperty('--pattern-repeat', 'repeat');
      root.style.setProperty('--pattern-position', 'center');

      const savedOpacity = localStorage.getItem('patternOpacity');
      const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 5;
      setPatternOpacity(opacityVal);
      root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
    }

    const patternEvent = new CustomEvent('patternChanged', {
      detail: {
        ...patternData,
        repeat: isWallpaper ? 'no-repeat' : 'repeat',
        position: 'center'
      }
    });
    window.dispatchEvent(patternEvent);
  };


  // Apply opacity
  const applyOpacity = (opacity) => {
    const root = document.documentElement;
    root.style.setProperty('--pattern-opacity', (opacity / 100).toString());

    const opacityEvent = new CustomEvent('opacityChanged', {
      detail: { opacity }
    });
    window.dispatchEvent(opacityEvent);
  };

  // Handle theme selection
  const handleThemeSelect = (themeId, category = 'solid') => {
    const categoryThemes = themeCategories.find(cat => cat.id === category)?.themes || themeOptions;
    const theme = categoryThemes.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(themeId);
      localStorage.setItem('appTheme', JSON.stringify(theme));
      applyTheme(theme);
      window.dispatchEvent(new Event('themeChanged'));
      setThemeDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Theme changed to ${theme.name}`,
        severity: 'success'
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file',
          severity: 'error'
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setUploadDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload with cropping
  const handleImageUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setUploading(true);

    try {
      // Crop the image using our getCroppedImg utility
      const croppedImageBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);

      // Create a unique ID for the image
      const imageId = `custom-${Date.now()}`;

      const imageData = {
        id: imageId,
        name: selectedFile ? selectedFile.name : `Wallpaper-${Date.now()}`,
        url: croppedImageBase64,
        type: 'custom-image',
        size: 'cover',
        category: 'custom',
        icon: '🖼️',
        uploadedAt: new Date().toISOString()
      };

      // Add to custom images
      const updatedImages = [...customImages, imageData];
      setCustomImages(updatedImages);
      localStorage.setItem('customWallpapers', JSON.stringify(updatedImages));

      // Automatically set this wallpaper as the active background pattern
      setSelectedPattern(imageId);
      localStorage.setItem('appPattern', JSON.stringify(imageData));
      applyPattern(imageData);

      setUploading(false);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedImage(null);

      setSnackbar({
        open: true,
        message: 'Wallpaper cropped and set successfully!',
        severity: 'success'
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to crop image:', error);
      setUploading(false);
      setSnackbar({
        open: true,
        message: 'Failed to crop and upload image',
        severity: 'error'
      });
    }
  };


  // Handle custom image selection
  const handleCustomImageSelect = (imageId) => {
    const image = customImages.find(img => img.id === imageId);
    if (image) {
      setSelectedPattern(imageId);
      localStorage.setItem('appPattern', JSON.stringify(image));
      applyPattern(image);
      setPatternDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Wallpaper set to ${image.name}`,
        severity: 'success'
      });
    }
  };

  // Handle custom image deletion
  const handleCustomImageDelete = (imageId, event) => {
    event.stopPropagation(); // Prevent pattern selection when deleting

    const updatedImages = customImages.filter(img => img.id !== imageId);
    setCustomImages(updatedImages);
    localStorage.setItem('customWallpapers', JSON.stringify(updatedImages));

    // If the deleted image was currently selected, revert to no pattern
    if (selectedPattern === imageId) {
      setSelectedPattern('none');
      localStorage.setItem('appPattern', JSON.stringify({ id: 'none', pattern: 'none' }));
      applyPattern({ id: 'none', pattern: 'none' });
    }

    setSnackbar({
      open: true,
      message: 'Wallpaper deleted',
      severity: 'info'
    });
  };

  // Handle pattern selection (updated to support custom images)
  const handlePatternSelect = (patternId) => {
    // Check if it's a custom image
    if (patternId.startsWith('custom-')) {
      handleCustomImageSelect(patternId);
      return;
    }

    // Handle regular patterns
    const pattern = allPatterns.find(p => p.id === patternId);
    if (pattern) {
      setSelectedPattern(patternId);
      localStorage.setItem('appPattern', JSON.stringify(pattern));
      applyPattern(pattern);
      setPatternDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Background pattern set to ${pattern.name}`,
        severity: 'success'
      });
    }
  };

  // Update profile visibility to backend and UI (safe wrapper)
  const updateProfileVisible = async (newValue) => {
    setPrivacyUpdating(true);
    const prevValue = switchState.profileVisible;
    // optimistically update UI
    setSwitchState(prev => ({ ...prev, profileVisible: newValue }));
    try {
      const res = await fetch(`${API_BASE}/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisible: newValue }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSnackbar({
        open: true,
        message: `Profile Visibility ${newValue ? 'enabled' : 'disabled'}`,
        severity: 'info'
      });
    } catch (err) {
      // revert on failure
      setSwitchState(prev => ({ ...prev, profileVisible: prevValue }));
      setSnackbar({ open: true, message: 'Failed to update profile visibility', severity: 'error' });
    } finally {
      setPrivacyUpdating(false);
    }
  };

  // Toggle profile visibility and ask confirmation when turning OFF
  const handleProfileVisibility = async () => {
    const newValue = !switchState.profileVisible;
    // if turning OFF, ask for confirmation
    if (!newValue) {
      setPendingProfileVisible(newValue);
      setConfirmPrivacyDialogOpen(true);
      return;
    }
    // turning ON - apply immediately
    await updateProfileVisible(newValue);
  };

  // Toggle message encryption and update backend
  const handleMessageEncryption = async () => {
    const newValue = !switchState.messageEncryption;
    setSwitchState(prev => ({ ...prev, messageEncryption: newValue }));
    await fetch(`${API_BASE}/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageEncryption: newValue }),
    });
    setSnackbar({
      open: true,
      message: `Message Encryption ${newValue ? 'enabled' : 'disabled'}`,
      severity: 'info'
    });
  };

  // Unified switch handler
  const handleSwitch = (key) => {
    if (key === 'profileVisible') {
      handleProfileVisibility();
      return;
    }
    if (key === 'messageEncryption') {
      handleMessageEncryption();
      return;
    }
    setSwitchState((prev) => ({ ...prev, [key]: !prev[key] }));
    setSnackbar({
      open: true,
      message: `${key.replace(/([A-Z])/g, ' $1')} ${!switchState[key] ? 'enabled' : 'disabled'}`,
      severity: 'info'
    });
  };

  // Enhanced Theme Preview Component
  const ThemePreview = ({ theme, category }) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: theme.colors.background,
        color: theme.colors.text,
        border: `3px solid ${selectedTheme === theme.id ? theme.colors.primary : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: 4
        }
      }}
      onClick={() => handleThemeSelect(theme.id, category)}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ mr: 1 }}>
            {theme.icon}
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
            {theme.name}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
          {theme.description}
        </Typography>
      </Box>

      {/* Color palette preview */}
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 1 }}>
        {Object.values(theme.colors).slice(0, 4).map((color, index) => (
          <Box
            key={index}
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: color,
              border: color === theme.colors.background ? `1px solid ${theme.colors.text}` : 'none'
            }}
          />
        ))}
      </Box>
    </Box>
  );

  // Enhanced Pattern Preview Component with support for custom images
  const PatternPreview = ({ pattern }) => {
    const getPatternStyle = () => {
      const isWall = pattern.isWallpaper || pattern.type === 'custom-image' || pattern.type === 'image';
      if (isWall) {
        return {
          backgroundImage: pattern.type === 'custom-image' ? `url("${pattern.url}")` : pattern.pattern,
          backgroundSize: pattern.size || 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        };
      } else {
        return {
          backgroundImage: pattern.pattern,
          backgroundSize: pattern.size || '20px 20px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        };
      }
    };

    const isCustomImage = pattern.type === 'custom-image';

    return (
      <Box
        sx={{
          p: isCustomImage ? 0 : 3,
          borderRadius: 2,
          bgcolor: 'var(--surface-color)',
          color: 'var(--text-color)',
          border: `2px solid ${selectedPattern === pattern.id ? 'var(--primary-color)' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isCustomImage ? 'flex-end' : 'center',
          alignItems: 'center',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 2
          },
          ...getPatternStyle()
        }}
        onClick={() => handlePatternSelect(pattern.id)}
      >
        {/* Overlay for custom images */}
        {isCustomImage && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              p: 1
            }}
          >
            <Typography
              variant="body2"
              fontWeight="500"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                px: 1,
                borderRadius: 1,
                fontSize: '0.7rem',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {pattern.name}
            </Typography>
          </Box>
        )}

        {/* For non-custom patterns */}
        {!isCustomImage && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                mixBlendMode: 'soft-light',
                pointerEvents: 'none'
              }}
            />

            <Typography variant="h4" sx={{ mb: 1, position: 'relative', zIndex: 1 }}>
              {pattern.icon}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="500"
              sx={{
                position: 'relative',
                zIndex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                px: 1,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {pattern.name}
            </Typography>
          </>
        )}

        {/* Delete button for custom images */}
        {isCustomImage && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'rgba(255, 0, 0, 0.7)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.9)'
              }
            }}
            onClick={(e) => handleCustomImageDelete(pattern.id, e)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  };

  // Upload Preview Component
  const UploadPreview = () => {
    if (!selectedFile) return null;

    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Preview
        </Typography>
        <Card sx={{ maxWidth: 200, mx: 'auto' }}>
          <CardMedia
            component="img"
            height="120"
            image={URL.createObjectURL(selectedFile)}
            alt="Preview"
            sx={{ objectFit: 'cover' }}
          />
        </Card>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </Typography>
      </Box>
    );
  };

  // Filter patterns by category (updated to include custom images)
  const filteredPatterns = React.useMemo(() => {
    if (patternTab === 'all') {
      return [...allPatterns, ...customImages];
    } else if (patternTab === 'custom') {
      return customImages;
    } else {
      return allPatterns.filter(pattern => pattern.category === patternTab);
    }
  }, [patternTab, customImages]);

  // Handle opacity change
  const handleOpacityChange = (event, newValue) => {
    setPatternOpacity(newValue);
    localStorage.setItem('patternOpacity', newValue.toString());
    applyOpacity(newValue);
    setSnackbar({
      open: true,
      message: `Pattern opacity set to ${newValue}%`,
      severity: 'info'
    });
  };

  // Save settings to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('settingsSwitchState', JSON.stringify(switchState));
  }, [switchState]);

  // Track if any popup, dialog, or subview is open in Settings
  const isAnySettingsModalOpen = 
    uploadDialogOpen ||
    themeDialogOpen ||
    patternDialogOpen ||
    opacityDialogOpen ||
    deleteDialogOpen ||
    confirmPrivacyDialogOpen ||
    showTutorialGuide ||
    showHelp ||
    showEditProfile;

  // Push fake history state when a popup/subview opens so browser back button fires popstate
  React.useEffect(() => {
    if (isAnySettingsModalOpen) {
      window.history.pushState({ settingsModal: true }, '');
    }
  }, [isAnySettingsModalOpen]);

  // Mobile Back Button Handler for Settings popups & subviews
  React.useEffect(() => {
    const handleSettingsBackPress = () => {
      if (uploadDialogOpen) {
        setUploadDialogOpen(false);
        return true;
      }
      if (themeDialogOpen) {
        setThemeDialogOpen(false);
        return true;
      }
      if (patternDialogOpen) {
        setPatternDialogOpen(false);
        return true;
      }
      if (opacityDialogOpen) {
        setOpacityDialogOpen(false);
        return true;
      }
      if (deleteDialogOpen) {
        setDeleteDialogOpen(false);
        return true;
      }
      if (confirmPrivacyDialogOpen) {
        setConfirmPrivacyDialogOpen(false);
        return true;
      }
      if (showTutorialGuide) {
        setShowTutorialGuide(false);
        return true;
      }
      if (showHelp) {
        setShowHelp(false);
        return true;
      }
      if (showEditProfile) {
        setShowEditProfile(false);
        return true;
      }
      return false;
    };

    // Native Capacitor Android back button
    let capListenerHandle = null;
    try {
      CapacitorApp.addListener('backButton', () => {
        handleSettingsBackPress();
      }).then(handle => {
        capListenerHandle = handle;
      }).catch(() => {});
    } catch (e) {}

    // Custom hardwareBack event
    const handleHardwareBack = (e) => {
      if (e.detail && e.detail.handled) return;
      const handled = handleSettingsBackPress();
      if (handled) {
        e.detail.handled = true;
      }
    };
    window.addEventListener('hardwareBack', handleHardwareBack);

    // Browser / PWA popstate back event
    const handlePopState = () => {
      handleSettingsBackPress();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hardwareBack', handleHardwareBack);
      window.removeEventListener('popstate', handlePopState);
      if (capListenerHandle && typeof capListenerHandle.remove === 'function') {
        capListenerHandle.remove();
      }
    };
  }, [
    uploadDialogOpen,
    themeDialogOpen,
    patternDialogOpen,
    opacityDialogOpen,
    deleteDialogOpen,
    confirmPrivacyDialogOpen,
    showTutorialGuide,
    showHelp,
    showEditProfile
  ]);

  if (showHelp) {
    return (
      <Box data-settings-subview="true" sx={{ 
        height: '100dvh', 
        width: '100%',
        bgcolor: 'var(--background-color, #fff6f8)',
        overflow: 'hidden'
      }}>
        <Help onBack={() => setShowHelp(false)} />
      </Box>
    );
  }

  // FIXED: If showing edit profile, render it with proper layout (no extra gap)
  if (showEditProfile) {
    return (
      <Box data-settings-subview="true" sx={{ 
        height: '100dvh', 
        width: '100%',
        bgcolor: 'var(--background-color, #fff6f8)',
        overflow: 'hidden'
      }}>
     
        
        {/* EditProfile Component - rendered directly without extra padding */}
        <EditProfile onBack={() => setShowEditProfile(false)} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'var(--background-color, #fff6f8)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'var(--app-font, "Poppins", sans-serif)',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          bgcolor: 'var(--surface-color, #fff)',
          borderRadius: 0,
          boxShadow: 'none',
          overflowY: 'auto',
          pt: { xs: 2.5, sm: 4 },
          pb: { xs: 12, sm: 8 },
          px: { xs: 2.5, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          zIndex: 1
        }}
      >


        {/* Sections */}
        {settingsSections.map((section) => (
          <Box key={section.title} sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'var(--primary-color, #ffffff)',
                fontWeight: 600,
                mb: 1,
                fontSize: '1rem',
                letterSpacing: 0.5
              }}
            >
              {section.title}
            </Typography>
            <Box>
              {section.items.map((item, i) => {
                const getClickHandler = () => {
                  if (item.type === 'theme-selector') return () => setThemeDialogOpen(true);
                  if (item.type === 'pattern-selector') return () => setPatternDialogOpen(true);
                  if (item.type === 'opacity-slider') return () => setOpacityDialogOpen(true);
                  if (item.type === 'switch') return () => handleSwitch(item.key);
                  if (item.label === 'Edit Profile') return () => setShowEditProfile(true);
                  if (item.label === 'Blocked Users') return () => navigate('/blocked-users');
                  if (item.label === 'Contact Gestures') return () => navigate('/finder');
                  if (item.label === 'Help & Support') return () => setShowHelp(true);
                  if (item.label === 'App Tutorial & User Guide') return () => setShowTutorialGuide(true);
                  return null;
                };

                return (
                  <Box key={item.label}>
                    <Box
                      onClick={getClickHandler()}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        py: 1.2,
                        px: 1,
                        cursor: item.type === 'switch' ? 'pointer' : item.type || item.label ? 'pointer' : 'default',
                        borderRadius: 1,
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(240, 98, 146, 0.06)'
                        }
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '1rem' }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ color: '#888', fontSize: '0.92rem', mt: 0.2 }}>
                          {item.desc}
                        </Typography>
                      </Box>

                      {/* Theme selector */}
                      {item.type === 'theme-selector' ? (
                        <IconButton
                          sx={{
                            color: 'var(--primary-color, #f06292)',
                            mt: 0.5,
                            pointerEvents: 'none'
                          }}
                        >
                          <PaletteIcon />
                        </IconButton>
                      ) :
                        /* Pattern selector */
                        item.type === 'pattern-selector' ? (
                          <IconButton
                            sx={{
                              color: 'var(--primary-color, #f06292)',
                              mt: 0.5,
                              pointerEvents: 'none'
                            }}
                          >
                            <TextureIcon />
                          </IconButton>
                        ) :
                          /* Opacity slider */
                          item.type === 'opacity-slider' ? (
                            <IconButton
                              sx={{
                                color: 'var(--primary-color, #f06292)',
                                mt: 0.5,
                                pointerEvents: 'none'
                              }}
                            >
                              <OpacityIcon />
                            </IconButton>
                          ) :
                            /* Account section navigation */
                            section.title === 'Account' ? (
                              <IconButton
                                sx={{
                                  color: 'var(--primary-color, #f06292)',
                                  mt: 0.5,
                                  pointerEvents: 'none',
                                  ...(isMobile && { p: 2 })
                                }}
                              >
                                <ArrowForwardIosIcon fontSize="small" />
                              </IconButton>
                            ) : item.type === 'switch' ? (
                              <Switch
                                checked={switchState[item.key]}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSwitch(item.key);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: 'var(--primary-color, #f06292)'
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    bgcolor: 'var(--primary-color, #f8bbd0)'
                                  }
                                }}
                              />
                            ) : (
                              <IconButton
                                sx={{ color: 'var(--primary-color, #f06292)', mt: 0.5, pointerEvents: 'none' }}
                              >
                                <ArrowForwardIosIcon fontSize="small" />
                              </IconButton>
                            )}
                    </Box>
                    {i < section.items.length - 1 && (
                      <Divider sx={{ bgcolor: 'var(--primary-color, #f8bbd0)', opacity: 0.3 }} />
                    )}
                  </Box>
                );
              })}


            </Box>
          </Box>
        ))}

        {/* Spacer to push buttons to bottom if content is short */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Place buttons at the bottom of the Settings list */}
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            gap: 2,
            justifyContent: isMobile ? 'stretch' : 'flex-end',
            alignItems: isMobile ? 'stretch' : 'center',
          }}
        >
          <Button
            variant="outlined"
            color="error"
            fullWidth={isMobile}
            sx={{
              borderColor: '#ec407a',
              color: '#ec407a',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(236, 64, 122, 0.08)',
                borderColor: '#d81b60',
                color: '#d81b60'
              }
            }}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: 'var(--primary-color, #ec407a)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'var(--primary-color, #d81b60)',
                filter: 'brightness(0.9)'
              }
            }}
            fullWidth={isMobile}
            onClick={async () => {
              localStorage.removeItem('userId');
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              localStorage.removeItem('profileImage');
              if (typeof window !== 'undefined' && window.Capacitor) {
                const { AudioRoute } = window.Capacitor.Plugins || {};
                if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
                  try {
                    await AudioRoute.clearSession();
                  } catch (e) {}
                }
              }
              navigate('/signin');
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Theme Selection Dialog */}
      <Dialog
        open={themeDialogOpen}
        onClose={() => setThemeDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: '#fff',
            color: 'var(--text-color)'
          }
        }}
      >
        <DialogTitle sx={{
          color: 'var(--primary-color)',
          fontWeight: 700,
          borderBottom: '1px solid var(--primary-color)',
          opacity: 0.8
        }}>
          Choose Theme
        </DialogTitle>

        <Tabs
          value={themeTab}
          onChange={(e, newValue) => setThemeTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: 'var(--text-color)',
              opacity: 0.7,
              minWidth: 'auto',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
              '&.Mui-selected': {
                color: 'var(--primary-color)',
                opacity: 1
              }
            },
            '& .MuiTabs-scrollButtons': {
              color: 'var(--primary-color)',
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
        >
          {themeCategories.map(category => (
            <Tab key={category.id} label={category.name} value={category.id} />
          ))}
        </Tabs>

        <DialogContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 2,
              mt: 2
            }}
          >
            {themeCategories
              .find(cat => cat.id === themeTab)
              ?.themes.map((theme) => (
                <ThemePreview key={theme.id} theme={theme} category={themeTab} />
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setThemeDialogOpen(false)}
            sx={{
              color: 'var(--primary-color)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Visibility Confirmation Dialog */}
      <Dialog
        open={confirmPrivacyDialogOpen}
        onClose={() => { if (!privacyUpdating) { setConfirmPrivacyDialogOpen(false); setPendingProfileVisible(null); } }}
      >
        <DialogTitle sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>
          Confirm Privacy Change
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to make your profile private? When private, your account will not appear in other users' suggestions or public lists.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setConfirmPrivacyDialogOpen(false); setPendingProfileVisible(null); }}
            disabled={privacyUpdating}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setConfirmPrivacyDialogOpen(false);
              await updateProfileVisible(pendingProfileVisible);
              setPendingProfileVisible(null);
            }}
            variant="contained"
            color="error"
            disabled={privacyUpdating}
            sx={{ textTransform: 'none' }}
          >
            {privacyUpdating ? 'Updating...' : 'Make Private'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pattern Selection Dialog - Enhanced with upload button */}
      <Dialog
        open={patternDialogOpen}
        onClose={() => setPatternDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: '#fff',
            color: 'var(--text-color)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          color: 'var(--primary-color)',
          fontWeight: 700,
          borderBottom: '1px solid var(--primary-color)',
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Choose Background
          <Button
            startIcon={<AddPhotoAlternateIcon />}
            variant="contained"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            sx={{
              bgcolor: '#1c67ca',
              '&:hover': {
                bgcolor: 'var(--primary-color)',
                filter: 'brightness(0.9)'
              }
            }}
          >
            Upload Wallpaper
          </Button>
        </DialogTitle>

        <Tabs
          value={patternTab}
          onChange={(e, newValue) => setPatternTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: 'var(--text-color)',
              opacity: 0.7,
              '&.Mui-selected': {
                color: 'var(--primary-color)',
                opacity: 1
              }
            },
            '& .MuiTabs-scrollButtons': {
              color: 'var(--primary-color)',
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
        >
          {patternCategories.map(category => (
            <Tab
              key={category.id}
              label={category.name}
              value={category.id}
              sx={{
                minWidth: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }}
            />
          ))}
        </Tabs>

        <DialogContent sx={{ p: 3 }}>
          {/* Custom images count display */}
          {patternTab === 'custom' && customImages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <WallpaperIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Custom Wallpapers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your own images to use as wallpapers
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Your First Wallpaper
              </Button>
            </Box>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)'
              },
              gap: 2,
              mt: 2
            }}
          >
            {filteredPatterns.map((pattern) => (
              <PatternPreview key={pattern.id} pattern={pattern} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPatternDialogOpen(false)}
            sx={{
              color: 'var(--primary-color)',
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileSelect}
      />

      {/* Image Upload / Cropper Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'var(--primary-color, #ec407a)',
          color: '#fff',
          fontWeight: 700,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Crop & Save Wallpaper
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, bgcolor: '#121212', display: 'flex', flexDirection: 'column' }}>
          {selectedImage && (
            <Box sx={{ position: 'relative', width: '100%', height: 340 }}>
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={cropAspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            </Box>
          )}

          <Box sx={{ p: 3, bgcolor: '#ffffff' }}>
            {/* Zoom Slider */}
            <Typography variant="body2" fontWeight="500" sx={{ mb: 1, color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) => setZoom(value)}
              sx={{
                color: 'var(--primary-color, #ec407a)',
                mb: 3,
                '& .MuiSlider-thumb': {
                  boxShadow: '0 2px 8px rgba(236,64,122,0.4)',
                },
              }}
            />

            {/* Aspect Ratio Selector */}
            <Typography variant="body2" fontWeight="500" sx={{ mb: 1.5, color: 'text.secondary' }}>
              Fit / Aspect Ratio
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {[
                { label: '9:16 (Vertical)', value: 9 / 16 },
                { label: '16:9 (Horizontal)', value: 16 / 9 },
                { label: '1:1 (Square)', value: 1 },
                { label: 'Free Crop', value: null }
              ].map((option, idx) => (
                <Chip
                  key={idx}
                  label={option.label}
                  clickable
                  color={cropAspectRatio === option.value ? 'primary' : 'default'}
                  onClick={() => setCropAspectRatio(option.value)}
                  sx={{
                    fontWeight: 600,
                    ...(cropAspectRatio === option.value && {
                      bgcolor: 'var(--primary-color, #ec407a)',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: 'var(--primary-color, #d81b60)',
                      }
                    })
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Tip: Choose **9:16 (Vertical)** for a perfect fit on mobile screens!
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
            sx={{
              color: '#888',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImageUpload}
            variant="contained"
            disabled={!selectedImage || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AddPhotoAlternateIcon />}
            sx={{
              bgcolor: 'var(--primary-color, #ec407a)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 14px rgba(236,64,122,0.3)',
              '&:hover': {
                bgcolor: 'var(--primary-color, #d81b60)',
              }
            }}
          >
            {uploading ? 'Cropping & Saving...' : 'Save & Set Wallpaper'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Opacity Control Dialog */}
      <Dialog
        open={opacityDialogOpen}
        onClose={() => setOpacityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: '#fff',
            color: 'var(--text-color)'
          }
        }}
      >
        <DialogTitle sx={{
          color: 'var(--primary-color)',
          fontWeight: 700
        }}>
          Pattern Opacity
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 3 }}>
            <Typography gutterBottom sx={{ mb: 3 }}>
              Adjust pattern visibility intensity: {patternOpacity}%
            </Typography>
            <Slider
              value={patternOpacity}
              onChange={handleOpacityChange}
              aria-labelledby="pattern-opacity-slider"
              valueLabelDisplay="auto"
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              min={0}
              max={100}
              sx={{
                color: 'var(--primary-color)',
                '& .MuiSlider-thumb': {
                  backgroundColor: 'var(--primary-color)',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'var(--primary-color)',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'var(--surface-color)',
                  opacity: 0.5
                }
              }}
            />
            <Box sx={{
              mt: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: 'var(--background-color)',
              background: 'var(--background-pattern, none)',
              backgroundSize: 'var(--pattern-size, 20px 20px)',
              backgroundRepeat: 'var(--pattern-repeat, repeat)',
              backgroundPosition: 'var(--pattern-position, center)',
              opacity: patternOpacity / 100,
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Preview: Current opacity {patternOpacity}%
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpacityDialogOpen(false)}
            sx={{
              color: 'var(--primary-color)',
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#ec407a', fontWeight: 700 }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Type <b>Delete My Account</b> to confirm. This action cannot be undone.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder="Delete My Account"
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#fff6f6',
                fontFamily: 'Poppins'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#888',
              borderRadius: 2,
              textTransform: 'none'
            }}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              setDeleting(true);
              try {
                const res = await fetch(`${API_BASE}/api/user/${userId}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  if (userId) {
                    localStorage.removeItem(`juicy_has_seen_user_guide_${userId}`);
                  }
                  localStorage.removeItem('juicy_has_seen_user_guide');
                  localStorage.removeItem('userId');
                  localStorage.removeItem('token');
                  localStorage.removeItem('username');
                  localStorage.removeItem('profileImage');
                  if (typeof window !== 'undefined' && window.Capacitor) {
                    const { AudioRoute } = window.Capacitor.Plugins || {};
                    if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
                      try {
                        await AudioRoute.clearSession();
                      } catch (e) {}
                    }
                  }
                  navigate('/signin');
                } else {
                  setSnackbar({ open: true, message: 'Failed to delete account', severity: 'error' });
                }
              } catch (err) {
                setSnackbar({ open: true, message: 'Server error', severity: 'error' });
              }
              setDeleting(false);
              setDeleteDialogOpen(false);
              setDeleteInput('');
            }}
            color="error"
            variant="contained"
            sx={{
              bgcolor: '#ec407a',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#d81b60' }
            }}
            disabled={deleteInput !== 'Delete My Account' || deleting}
          >
            {deleting ? 'Deleting...' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1800}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          sx={{ fontFamily: 'var(--app-font, "Poppins")', fontWeight: 500 }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      {/* App Tutorial & User Guide Modal */}
      <UserGuideModal
        open={showTutorialGuide}
        onClose={() => setShowTutorialGuide(false)}
        initialStep={0}
        isDarkTheme={false}
        hideSkipButton={true}
      />
    </Box>
  );
};

export default Settings;