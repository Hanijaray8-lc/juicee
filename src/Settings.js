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
  InputAdornment,
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
import SettingsIcon from '@mui/icons-material/Settings';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useSwipeBack from './hooks/useSwipeBack';
import API_BASE_URL from './config/apiConfig';
import MuiAlert from '@mui/material/Alert';
import EditProfile from './Profile';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';
import { getProfileImageSrc } from './utils/imageUtils';
import { FeatureCatalogModal } from './UserGuideModal';
import Help from './Help';
import { App as CapacitorApp } from '@capacitor/app';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import RingtoneModal from './components/RingtoneModal';
import { getRingtoneSetting } from './utils/ringtoneManager';
import { useSocket } from './context/socketContext';
import {
  getCustomWallpapersLocally,
  saveCustomWallpaperLocally,
  deleteCustomWallpaperLocally,
  saveAppSettingLocally,
  getAppSettingLocally,
} from './db/offlineDb';


// Theme options (32 Solid Pastels & Clean Themes)
const themeOptions = [
  { id: 'light', name: 'Light', description: 'Bright and clear with soft pastels', colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' }, icon: '☀️' },
  { id: 'dark', name: 'Dark', description: 'Sleek and modern with deep tones', colors: { primary: '#f06292', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌙' },
  { id: 'ocean', name: 'Ocean Breeze', description: 'Calming blues and seafoam greens', colors: { primary: '#4db6ac', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🌊' },
  { id: 'sunset', name: 'Sunset Glow', description: 'Warm oranges and pinks for a cozy feel', colors: { primary: '#ff8a65', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  { id: 'forest', name: 'Forest Whisper', description: 'Earthy greens and browns for a natural vibe', colors: { primary: '#81c784', background: '#e8f5e9', surface: '#ffffff', text: '#1b5e20' }, icon: '🌳' },
  { id: 'lavender', name: 'Lavender Dream', description: 'Soft purples and lilacs for a dreamy atmosphere', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💜' },
  { id: 'citrus', name: 'Citrus Zest', description: 'Vibrant yellows and greens for an energetic feel', colors: { primary: '#ffeb3b', background: '#f9fbe7', surface: '#ffffff', text: '#f57f17' }, icon: '🍋' },
  { id: 'midnight', name: 'Midnight Mystery', description: 'Dark purples and blues for a mysterious vibe', colors: { primary: '#9575cd', background: '#ede7f6', surface: '#ffffff', text: '#311b92' }, icon: '🌌' },
  { id: 'rose', name: 'Rose Garden', description: 'Soft pinks and greens for a romantic feel', colors: { primary: '#f48fb1', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🌹' },
  { id: 'autumn', name: 'Autumn Harvest', description: 'Warm reds, oranges, and browns for a cozy fall vibe', colors: { primary: '#ff7043', background: '#fff8e1', surface: '#ffffff', text: '#bf360c' }, icon: '🍂' },
  { id: 'mint', name: 'Mint Fresh', description: 'Cool minty greens and whites for a refreshing feel', colors: { primary: '#4db6ac', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🍃' },
  { id: 'grape', name: 'Grape Escape', description: 'Rich purples and soft lavenders for a sweet vibe', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '🍇' },
  { id: 'sunrise', name: 'Sunrise Bliss', description: 'Soft pinks and oranges for a peaceful morning feel', colors: { primary: '#ff8a65', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  { id: 'steel', name: 'Steel Blue', description: 'Cool steel blues and grays for a modern industrial vibe', colors: { primary: '#90a4ae', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🔩' },
  { id: 'peach', name: 'Peachy Keen', description: 'Soft peaches and creams for a sweet and cozy feel', colors: { primary: '#ffab91', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🍑' },
  { id: 'slate', name: 'Slate Gray', description: 'Neutral grays with a hint of blue for a sophisticated look', colors: { primary: '#90a4ae', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🪨' },
  { id: 'coral', name: 'Coral Reef', description: 'Vibrant corals and teals for a lively ocean vibe', colors: { primary: '#ff7043', background: '#e0f7fa', surface: '#ffffff', text: '#004d40' }, icon: '🪸' },
  { id: 'orchid', name: 'Orchid Bloom', description: 'Soft purples and pinks for a delicate floral feel', colors: { primary: '#ba68c8', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💐' },
  { id: 'cocoa', name: 'Cocoa Delight', description: 'Warm browns and creams for a cozy chocolate vibe', colors: { primary: '#6d4c41', background: '#efebe9', surface: '#ffffff', text: '#3e2723' }, icon: '🍫' },
  { id: 'sky', name: 'Sky High', description: 'Bright blues and whites for a fresh and airy feel', colors: { primary: '#64b5f6', background: '#e3f2fd', surface: '#ffffff', text: '#01579b' }, icon: '☁️' },
  { id: 'berry', name: 'Berry Bliss', description: 'Rich berry tones and soft pinks for a sweet and vibrant vibe', colors: { primary: '#f06292', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🍓' },
  { id: 'strawberry', name: 'Strawberry Cream', description: 'Luscious red berries with velvety sweet cream', colors: { primary: '#ff2d6c', background: '#fff0f4', surface: '#ffffff', text: '#400015' }, icon: '🍓' },
  { id: 'matcha', name: 'Matcha Latte', description: 'Japanese ceremonial green tea with rich froth', colors: { primary: '#659c35', background: '#f3f8ec', surface: '#ffffff', text: '#21380e' }, icon: '🍵' },
  { id: 'bubblegum', name: 'Bubblegum Pop', description: 'Playful vibrant pinks for a bouncy pop aesthetic', colors: { primary: '#ff4db8', background: '#fff2fa', surface: '#ffffff', text: '#59003b' }, icon: '🍬' },
  { id: 'honey', name: 'Golden Honey', description: 'Sweet golden nectar with warm sunny notes', colors: { primary: '#f39c12', background: '#fffbf0', surface: '#ffffff', text: '#5c3a00' }, icon: '🍯' },
  { id: 'pistachio', name: 'Pistachio Gelato', description: 'Creamy artisan pistachio with delicate herbal mint', colors: { primary: '#48bb78', background: '#f0faf4', surface: '#ffffff', text: '#134e2b' }, icon: '🍨' },
  { id: 'cherry', name: 'Cherry Fizz', description: 'Tart sparkling cherry with bright ruby highlights', colors: { primary: '#e8175d', background: '#fff0f5', surface: '#ffffff', text: '#4d001a' }, icon: '🍒' },
  { id: 'turquoise', name: 'Turquoise Lagoon', description: 'Crystal-clear tropical water on a white sand shore', colors: { primary: '#00b894', background: '#e8faf6', surface: '#ffffff', text: '#004235' }, icon: '🏝️' },
  { id: 'lilac', name: 'Lilac Blossom', description: 'Soft botanical lilac with dreamy periwinkle undertones', colors: { primary: '#8c7ae6', background: '#f5f3ff', surface: '#ffffff', text: '#291b61' }, icon: '🌸' },
  { id: 'caramel', name: 'Salted Caramel', description: 'Rich buttery caramel with a warm golden finish', colors: { primary: '#c67d43', background: '#fdf6ee', surface: '#ffffff', text: '#4a2507' }, icon: '🍮' },
  { id: 'seafoam', name: 'Seafoam Mist', description: 'Refreshing ocean mist with clean aquamarine air', colors: { primary: '#20bf6b', background: '#eafaf1', surface: '#ffffff', text: '#0a4223' }, icon: '🫧' },
  { id: 'apricot', name: 'Apricot Glow', description: 'Sun-drenched apricot with a soft citrus peel warmth', colors: { primary: '#fa8231', background: '#fff5ee', surface: '#ffffff', text: '#592200' }, icon: '🍊' }
];

// Gradient Themes (26 Gradients & Luminous Colors)
const gradientThemes = [
  { id: 'sunset-gradient', name: 'Sunset Gradient', description: 'Warm gradient blending oranges and pinks', colors: { primary: 'linear-gradient(135deg, #ff8a65, #ff7043)', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🌅' },
  { id: 'ocean-gradient', name: 'Ocean Gradient', description: 'Cool gradient blending blues and teals', colors: { primary: 'linear-gradient(135deg, #4db6ac, #26a69a)', background: '#e0f2f1', surface: '#ffffff', text: '#004d40' }, icon: '🌊' },
  { id: 'lavender-gradient', name: 'Lavender Gradient', description: 'Soft gradient blending purples and lilacs', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💜' },
  { id: 'citrus-gradient', name: 'Citrus Gradient', description: 'Vibrant gradient blending yellows and greens', colors: { primary: 'linear-gradient(135deg, #ffeb3b, #cddc39)', background: '#f9fbe7', surface: '#ffffff', text: '#f57f17' }, icon: '🍋' },
  { id: 'midnight-gradient', name: 'Midnight Gradient', description: 'Dark gradient blending purples and blues', colors: { primary: 'linear-gradient(135deg, #9575cd, #7e57c2)', background: '#ede7f6', surface: '#ffffff', text: '#311b92' }, icon: '🌌' },
  { id: 'rose-gradient', name: 'Rose Gradient', description: 'Soft gradient blending pinks and greens', colors: { primary: 'linear-gradient(135deg, #f48fb1, #f06292)', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🌹' },
  { id: 'steel-gradient', name: 'Steel Gradient', description: 'Cool gradient blending steel blues and grays', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🔩' },
  { id: 'coral-gradient', name: 'Coral Gradient', description: 'Vibrant gradient blending corals and teals', colors: { primary: 'linear-gradient(135deg, #ff7043, #26a69a)', background: '#e0f7fa', surface: '#ffffff', text: '#004d40' }, icon: '🪸' },
  { id: 'orchid-gradient', name: 'Orchid Gradient', description: 'Soft gradient blending purples and pinks', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#f3e5f5', surface: '#ffffff', text: '#4a148c' }, icon: '💐' },
  { id: 'cocoa-gradient', name: 'Cocoa Gradient', description: 'Warm gradient blending browns and creams', colors: { primary: 'linear-gradient(135deg, #6d4c41, #5d4037)', background: '#efebe9', surface: '#ffffff', text: '#3e2723' }, icon: '🍫' },
  { id: 'sky-gradient', name: 'Sky Gradient', description: 'Bright gradient blending blues and whites', colors: { primary: 'linear-gradient(135deg, #64b5f6, #e3f2fd)', background: '#e3f2fd', surface: '#ffffff', text: '#01579b' }, icon: '☁️' },
  { id: 'berry-gradient', name: 'Berry Gradient', description: 'Rich gradient blending berry tones and soft pinks', colors: { primary: 'linear-gradient(135deg, #f06292, #f48fb1)', background: '#fce4ec', surface: '#ffffff', text: '#880e4f' }, icon: '🍓' },
  { id: 'peach-gradient', name: 'Peach Gradient', description: 'Soft gradient blending peaches and creams', colors: { primary: 'linear-gradient(135deg, #ffab91, #ff7043)', background: '#fff3e0', surface: '#ffffff', text: '#bf360c' }, icon: '🍑' },
  { id: 'slate-gradient', name: 'Slate Gradient', description: 'Neutral gradient blending grays with a hint of blue', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#eceff1', surface: '#ffffff', text: '#263238' }, icon: '🪨' },
  { id: 'aurora-gradient', name: 'Aurora Borealis', description: 'Luminous emerald and arctic blue dancing lights', colors: { primary: 'linear-gradient(135deg, #00c9ff, #92fe9d)', background: '#eafaf4', surface: '#ffffff', text: '#083829' }, icon: '🌌' },
  { id: 'cotton-candy-gradient', name: 'Cotton Candy', description: 'Pastel spun sugar blending pinks and baby blues', colors: { primary: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', background: '#f8f4fc', surface: '#ffffff', text: '#3c2462' }, icon: '🍭' },
  { id: 'fire-gradient', name: 'Ember Flame', description: 'Roaring blaze with intense fiery orange energy', colors: { primary: 'linear-gradient(135deg, #f83600, #fe8c00)', background: '#fff5ee', surface: '#ffffff', text: '#611600' }, icon: '🔥' },
  { id: 'neon-glow-gradient', name: 'Cyber Magenta', description: 'High-voltage electric magenta with deep violet', colors: { primary: 'linear-gradient(135deg, #ff007f, #7928ca)', background: '#fbf0f8', surface: '#ffffff', text: '#420638' }, icon: '⚡' },
  { id: 'emerald-gradient', name: 'Emerald Forest', description: 'Lush rainforest greens with crystalline highlights', colors: { primary: 'linear-gradient(135deg, #11998e, #38ef7d)', background: '#edfbf5', surface: '#ffffff', text: '#08432a' }, icon: '🌲' },
  { id: 'miami-gradient', name: 'Miami Vice', description: 'South Beach neon pink melting into golden sand', colors: { primary: 'linear-gradient(135deg, #fa709a, #fee140)', background: '#fff8f0', surface: '#ffffff', text: '#592500' }, icon: '🌴' },
  { id: 'cosmic-gradient', name: 'Cosmic Nebula', description: 'Deep interstellar purple blending into cosmic blue', colors: { primary: 'linear-gradient(135deg, #667eea, #764ba2)', background: '#f1f2fc', surface: '#ffffff', text: '#211c52' }, icon: '🪐' },
  { id: 'dragon-gradient', name: 'Dragon Fruit', description: 'Vivid magenta-crimson with warm coral splashes', colors: { primary: 'linear-gradient(135deg, #ff0844, #ffb199)', background: '#fff0f2', surface: '#ffffff', text: '#5e071c' }, icon: '🪷' },
  { id: 'peacock-gradient', name: 'Peacock Feathers', description: 'Regal turquoise and royal sapphire shimmer', colors: { primary: 'linear-gradient(135deg, #0acffe, #495aff)', background: '#eef5fc', surface: '#ffffff', text: '#0c2266' }, icon: '🦚' },
  { id: 'golden-hour-gradient', name: 'Golden Hour', description: 'Warm twilight glow right as the sun touches the horizon', colors: { primary: 'linear-gradient(135deg, #f6d365, #fda085)', background: '#fff9f0', surface: '#ffffff', text: '#5c3800' }, icon: '☀️' },
  { id: 'mystic-garden-gradient', name: 'Mystic Garden', description: 'Enchanted spring waters with delicate mint hues', colors: { primary: 'linear-gradient(135deg, #84fab0, #8fd3f4)', background: '#f0fcf9', surface: '#ffffff', text: '#0f4840' }, icon: '🌿' },
  { id: 'juicy-signature-gradient', name: 'Juicy Signature', description: 'The iconic 3D Juicy gradient pink with lustrous glow', colors: { primary: 'linear-gradient(135deg, #ff2d6c, #ff758c)', background: '#fff3f6', surface: '#ffffff', text: '#570821' }, icon: '💖' }
];

// Dark Themes (28 Dark, Night & AMOLED Themes)
const darkThemes = [
  { id: 'dark-theme', name: 'Dark', description: 'Sleek and modern with deep tones', colors: { primary: '#f06292', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌙' },
  { id: 'midnight-dark', name: 'Midnight Mystery', description: 'Dark purples and blues for a mysterious vibe', colors: { primary: '#9575cd', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌌' },
  { id: 'steel-dark', name: 'Steel Blue', description: 'Cool steel blues and grays for a modern industrial vibe', colors: { primary: '#90a4ae', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🔩' },
  { id: 'cocoa-dark', name: 'Cocoa Delight', description: 'Warm browns and creams for a cozy chocolate vibe', colors: { primary: '#6d4c41', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🍫' },
  { id: 'sky-dark', name: 'Sky High', description: 'Bright blues and whites for a fresh and airy feel', colors: { primary: '#64b5f6', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '☁️' },
  { id: 'midnight-gradient-dark', name: 'Midnight Gradient', description: 'Dark gradient blending purples and blues', colors: { primary: 'linear-gradient(135deg, #9575cd, #7e57c2)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌌' },
  { id: 'steel-gradient-dark', name: 'Steel Gradient', description: 'Cool gradient blending steel blues and grays', colors: { primary: 'linear-gradient(135deg, #90a4ae, #78909c)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🔩' },
  { id: 'coral-gradient-dark', name: 'Coral Gradient', description: 'Vibrant gradient blending corals and teals', colors: { primary: 'linear-gradient(135deg, #ff7043, #26a69a)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🪸' },
  { id: 'orchid-gradient-dark', name: 'Orchid Gradient', description: 'Soft gradient blending purples and pinks', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '💐' },
  { id: 'cocoa-gradient-dark', name: 'Cocoa Gradient', description: 'Warm gradient blending browns and creams', colors: { primary: 'linear-gradient(135deg, #6d4c41, #5d4037)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🍫' },
  { id: 'sky-gradient-dark', name: 'Sky Gradient', description: 'Bright gradient blending blues and whites', colors: { primary: 'linear-gradient(135deg, #64b5f6, #e3f2fd)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '☁️' },
  { id: 'berry-gradient-dark', name: 'Berry Gradient', description: 'Rich gradient blending berry tones and soft pinks', colors: { primary: 'linear-gradient(135deg, #f06292, #f48fb1)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🍓' },
  { id: 'sunset-gradient-dark', name: 'Sunset Gradient', description: 'Warm gradient blending oranges and pinks', colors: { primary: 'linear-gradient(135deg, #ff8a65, #ff7043)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌅' },
  { id: 'ocean-gradient-dark', name: 'Ocean Gradient', description: 'Cool gradient blending blues and teals', colors: { primary: 'linear-gradient(135deg, #4db6ac, #26a69a)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🌊' },
  { id: 'lavender-gradient-dark', name: 'Lavender Gradient', description: 'Soft gradient blending purples and lilacs', colors: { primary: 'linear-gradient(135deg, #ba68c8, #ab47bc)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '💜' },
  { id: 'citrus-gradient-dark', name: 'Citrus Gradient', description: 'Vibrant gradient blending yellows and greens', colors: { primary: 'linear-gradient(135deg, #ffeb3b, #cddc39)', background: '#121212', surface: '#1e1e1e', text: '#ffffff' }, icon: '🍋' },
  { id: 'amoled-black', name: 'Pitch AMOLED Black', description: 'True zero-light black engineered for battery preservation', colors: { primary: '#ff2d6c', background: '#000000', surface: '#0d0d0d', text: '#f5f5f5' }, icon: '🖤' },
  { id: 'cyberpunk-dark', name: 'Cyberpunk Neon', description: 'Futuristic night city with cyan lasers and dark alleys', colors: { primary: '#00f2fe', background: '#090a14', surface: '#121424', text: '#e0f7fa' }, icon: '🌆' },
  { id: 'matrix-dark', name: 'Matrix Green', description: 'Digital rain terminal with glowing phosphor green', colors: { primary: '#00ff66', background: '#061209', surface: '#0d2113', text: '#e8f5e9' }, icon: '💻' },
  { id: 'vampire-dark', name: 'Crimson Nocturne', description: 'Sensual blood-red accents on midnight velvet', colors: { primary: '#ff1744', background: '#120508', surface: '#220b10', text: '#fce4ec' }, icon: '🩸' },
  { id: 'dracula-dark', name: 'Dracula Purple', description: 'The famous gothic vampire palette with soft purples', colors: { primary: '#bd93f9', background: '#1e1f29', surface: '#282a36', text: '#f8f8f2' }, icon: '🧛' },
  { id: 'obsidian-gold', name: 'Obsidian Gold', description: 'Ultra-luxurious pure gold trimmed in obsidian armor', colors: { primary: '#ffd700', background: '#0e0e10', surface: '#1a1a1c', text: '#fff9e6' }, icon: '⚜️' },
  { id: 'tokyo-night', name: 'Tokyo Night', description: 'Clean Japanese anime night aesthetic with neon blues', colors: { primary: '#7aa2f7', background: '#16161e', surface: '#1f2335', text: '#c0caf5' }, icon: '🗼' },
  { id: 'nordic-frost', name: 'Nordic Frost', description: 'Scandinavian icy tundra with calm slate blues', colors: { primary: '#88c0d0', background: '#191d24', surface: '#242933', text: '#eceff4' }, icon: '❄️' },
  { id: 'abyss-blue', name: 'Deep Abyss', description: 'Bioluminescent cyan deep underwater at midnight', colors: { primary: '#00d2d3', background: '#041019', surface: '#081c2c', text: '#e0f2f1' }, icon: '🌊' },
  { id: 'emerald-dark', name: 'Emerald Shadows', description: 'Deep dark forest with glowing mystical emeralds', colors: { primary: '#2ecc71', background: '#09150e', surface: '#112419', text: '#e8f8f0' }, icon: '🌲' },
  { id: 'monokai-dark', name: 'Monokai Pro', description: 'Iconic warm golden coder contrast on dark charcoal', colors: { primary: '#ffd866', background: '#19181a', surface: '#221f22', text: '#fdf9f3' }, icon: '🎨' },
  { id: 'synthwave-dark', name: '80s Synthwave', description: 'Retro arcade outrun with hot pink and neon purple', colors: { primary: 'linear-gradient(135deg, #ff007f, #7928ca)', background: '#0f081d', surface: '#1c1035', text: '#ffddf4' }, icon: '📼' }
];

// Aesthetic & Juicy Special Themes (15 Aesthetic Trends)
const aestheticThemes = [
  { id: 'juicy-pop', name: 'Juicy Pop', description: 'Signature high-gloss Juicy pink with candy bubble flair', colors: { primary: 'linear-gradient(135deg, #ff2a70, #ff6b8b)', background: '#fff0f5', surface: '#ffffff', text: '#3c0017' }, icon: '🍓' },
  { id: 'pastel-dream', name: 'Pastel Cloudscape', description: 'Whimsical marshmallow clouds with gentle peach blush', colors: { primary: '#ff9a9e', background: '#fdfbfb', surface: '#ffffff', text: '#402935' }, icon: '☁️' },
  { id: 'matcha-boba', name: 'Matcha Boba', description: 'Sweet iced matcha with creamy oat milk aesthetic', colors: { primary: '#556b2f', background: '#f5f7ed', surface: '#ffffff', text: '#2d3819' }, icon: '🧋' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', description: 'Kyoto spring sakura petals floating in clean morning air', colors: { primary: 'linear-gradient(135deg, #ff758c, #ff7eb3)', background: '#fff5f8', surface: '#ffffff', text: '#500826' }, icon: '🌸' },
  { id: 'holographic', name: 'Holographic Prism', description: 'Light-bending iridescent rainbow sheen on clean glass', colors: { primary: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', background: '#f4f8ff', surface: '#ffffff', text: '#1b3252' }, icon: '🪩' },
  { id: 'velvet-peach', name: 'Velvet Peach', description: 'Soft velvet fuzzy peach with warm radiant apricot sunset', colors: { primary: 'linear-gradient(135deg, #ff9966, #ff5e62)', background: '#fff5f0', surface: '#ffffff', text: '#541c00' }, icon: '🍑' },
  { id: 'lavender-haze', name: 'Lavender Haze', description: 'Hypnotic purple-magenta dusk inspired by sweet dreams', colors: { primary: 'linear-gradient(135deg, #c471ed, #f64f59)', background: '#fbf4fc', surface: '#ffffff', text: '#430d47' }, icon: '🪻' },
  { id: 'galaxy-dust', name: 'Galaxy Stardust', description: 'Multiverse stardust trail glowing through warm galaxies', colors: { primary: 'linear-gradient(135deg, #8a2387, #e94057, #f27121)', background: '#faf0f8', surface: '#ffffff', text: '#3b0024' }, icon: '🌠' },
  { id: 'espresso-cream', name: 'Espresso Macchiato', description: 'Cozy Italian dark roast with golden crema swirls', colors: { primary: '#795548', background: '#fbf8f5', surface: '#ffffff', text: '#3e2723' }, icon: '☕' },
  { id: 'lemon-sherbet', name: 'Lemon Sherbet', description: 'Crisp citrus zest with fresh Italian lime sweetness', colors: { primary: 'linear-gradient(135deg, #fbc531, #4cd137)', background: '#fefef2', surface: '#ffffff', text: '#4c4100' }, icon: '🍋' },
  { id: 'taro-milk-tea', name: 'Taro Milk Tea', description: 'Sweet purple taro with rich cream boba pearls', colors: { primary: '#9c88ff', background: '#f8f6ff', surface: '#ffffff', text: '#301b78' }, icon: '🧋' },
  { id: 'sugar-plum', name: 'Sugar Plum Fairy', description: 'Sparkling royal plum with soft golden fairy shimmer', colors: { primary: 'linear-gradient(135deg, #d299c2, #fef9d7)', background: '#faf5f8', surface: '#ffffff', text: '#421a37' }, icon: '🧚' },
  { id: 'vaporwave-dream', name: 'Vaporwave Dreams', description: '90s aesthetic pastel magenta with turquoise horizon', colors: { primary: 'linear-gradient(135deg, #ff71ce, #01cdfe)', background: '#fff2fb', surface: '#ffffff', text: '#390033' }, icon: '🌇' },
  { id: 'electric-violet', name: 'Electric Violet', description: 'Intense energetic ultraviolet with crystal highlights', colors: { primary: '#8b5cf6', background: '#f5f3ff', surface: '#ffffff', text: '#2e1065' }, icon: '⚡' },
  { id: 'mint-chocolate', name: 'Mint Chocolate', description: 'Decadent dark chocolate chunks folded into crisp fresh mint', colors: { primary: '#10b981', background: '#f0fdf4', surface: '#ffffff', text: '#064e3b' }, icon: '🍫' }
];

const allAvailableThemes = [...themeOptions, ...gradientThemes, ...darkThemes, ...aestheticThemes];


// Background Patterns (using pure CSS gradient patterns - 36 patterns)
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
    id: 'hearts',
    name: 'Sweet Hearts',
    icon: '💖',
    pattern: 'radial-gradient(circle at 35% 35%, var(--pattern-color, rgba(0,0,0,0.1)) 3px, transparent 3.5px), radial-gradient(circle at 65% 35%, var(--pattern-color, rgba(0,0,0,0.1)) 3px, transparent 3.5px)',
    size: '24px 24px',
    category: 'patterns'
  },
  {
    id: 'stars',
    name: 'Starlight Sparkles',
    icon: '✨',
    pattern: 'radial-gradient(1px 1px at 15px 15px, var(--pattern-color, rgba(0,0,0,0.15)), transparent), radial-gradient(1.5px 1.5px at 35px 45px, var(--pattern-color, rgba(0,0,0,0.15)), transparent), radial-gradient(1px 1px at 55px 25px, var(--pattern-color, rgba(0,0,0,0.15)), transparent)',
    size: '70px 70px',
    category: 'patterns'
  },
  {
    id: 'hexagons',
    name: 'Honeycomb Hex',
    icon: '🐝',
    pattern: 'linear-gradient(60deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%), linear-gradient(120deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%)',
    size: '24px 42px',
    category: 'patterns'
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch Mesh',
    icon: '🕸️',
    pattern: 'repeating-linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0px, var(--pattern-color, rgba(0,0,0,0.06)) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0px, var(--pattern-color, rgba(0,0,0,0.06)) 1px, transparent 1px, transparent 10px)',
    size: '10px 10px',
    category: 'patterns'
  },
  {
    id: 'zigzag',
    name: 'Electric Zigzag',
    icon: '⚡',
    pattern: 'linear-gradient(135deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(225deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(315deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%), linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%)',
    size: '28px 14px',
    category: 'patterns'
  },
  {
    id: 'diamonds',
    name: 'Harlequin Diamond',
    icon: '🔷',
    pattern: 'linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%), linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%)',
    size: '24px 24px',
    category: 'patterns'
  },
  {
    id: 'plus',
    name: 'Minimal Cross',
    icon: '➕',
    pattern: 'linear-gradient(0deg, transparent 46%, var(--pattern-color, rgba(0,0,0,0.09)) 46%, var(--pattern-color, rgba(0,0,0,0.09)) 54%, transparent 54%), linear-gradient(90deg, transparent 46%, var(--pattern-color, rgba(0,0,0,0.09)) 46%, var(--pattern-color, rgba(0,0,0,0.09)) 54%, transparent 54%)',
    size: '20px 20px',
    category: 'patterns'
  },
  {
    id: 'carbon',
    name: 'Carbon Matrix',
    icon: '🏎️',
    pattern: 'repeating-linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0px, var(--pattern-color, rgba(0,0,0,0.06)) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0px, var(--pattern-color, rgba(0,0,0,0.06)) 2px, transparent 2px, transparent 6px)',
    size: '12px 12px',
    category: 'patterns'
  },
  {
    id: 'tartan',
    name: 'Plaid Tartan',
    icon: '🧣',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 12px, var(--pattern-color, rgba(0,0,0,0.05)) 12px, var(--pattern-color, rgba(0,0,0,0.05)) 24px), repeating-linear-gradient(90deg, transparent, transparent 12px, var(--pattern-color, rgba(0,0,0,0.05)) 12px, var(--pattern-color, rgba(0,0,0,0.05)) 24px)',
    size: '48px 48px',
    category: 'patterns'
  },
  {
    id: 'moroccan',
    name: 'Moroccan Trellis',
    icon: '🕌',
    pattern: 'radial-gradient(circle at 100% 150%, var(--pattern-color, rgba(0,0,0,0.06)) 24%, transparent 25%), radial-gradient(circle at 0% 150%, var(--pattern-color, rgba(0,0,0,0.06)) 24%, transparent 25%), radial-gradient(circle at 50% 100%, var(--pattern-color, rgba(0,0,0,0.06)) 12%, transparent 13%)',
    size: '36px 18px',
    category: 'patterns'
  },
  {
    id: 'scales',
    name: 'Mermaid Scales',
    icon: '🧜‍♀️',
    pattern: 'radial-gradient(circle at 50% 0, transparent 35%, var(--pattern-color, rgba(0,0,0,0.08)) 35%, var(--pattern-color, rgba(0,0,0,0.08)) 42%, transparent 42%)',
    size: '32px 20px',
    category: 'patterns'
  },
  {
    id: 'houndstooth',
    name: 'Classic Weave',
    icon: '♟️',
    pattern: 'linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%), linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 25%, transparent 25%, transparent 75%, var(--pattern-color, rgba(0,0,0,0.06)) 75%)',
    size: '18px 18px',
    category: 'patterns'
  },
  {
    id: 'brick',
    name: 'Subway Brick',
    icon: '🧱',
    pattern: 'linear-gradient(0deg, var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px)',
    size: '32px 16px',
    category: 'patterns'
  },
  {
    id: 'stipple',
    name: 'Fine Stipple',
    icon: '⏳',
    pattern: 'radial-gradient(var(--pattern-color, rgba(0,0,0,0.12)) 1px, transparent 1px)',
    size: '8px 8px',
    category: 'patterns'
  },
  {
    id: 'diagonal-dense',
    name: 'Micro Ribs',
    icon: '📐',
    pattern: 'repeating-linear-gradient(60deg, var(--pattern-color, rgba(0,0,0,0.07)) 0px, var(--pattern-color, rgba(0,0,0,0.07)) 1px, transparent 1px, transparent 6px)',
    size: '6px 6px',
    category: 'patterns'
  },
  {
    id: 'concentric',
    name: 'Ripple Rings',
    icon: '🎯',
    pattern: 'radial-gradient(circle, transparent 25%, var(--pattern-color, rgba(0,0,0,0.06)) 26%, var(--pattern-color, rgba(0,0,0,0.06)) 29%, transparent 30%, transparent 45%, var(--pattern-color, rgba(0,0,0,0.06)) 46%, var(--pattern-color, rgba(0,0,0,0.06)) 49%, transparent 50%)',
    size: '36px 36px',
    category: 'patterns'
  },
  {
    id: 'circuit',
    name: 'Cyber Traces',
    icon: '🔌',
    pattern: 'linear-gradient(90deg, var(--pattern-color, rgba(0,0,0,0.07)) 1px, transparent 1px), linear-gradient(0deg, var(--pattern-color, rgba(0,0,0,0.07)) 1px, transparent 1px), radial-gradient(circle, var(--pattern-color, rgba(0,0,0,0.12)) 2px, transparent 2.5px)',
    size: '24px 24px',
    category: 'patterns'
  },
  {
    id: 'bamboo',
    name: 'Bamboo Lattice',
    icon: '🎋',
    pattern: 'linear-gradient(90deg, var(--pattern-color, rgba(0,0,0,0.07)) 2px, transparent 2px), linear-gradient(0deg, var(--pattern-color, rgba(0,0,0,0.04)) 1px, transparent 1px)',
    size: '16px 30px',
    category: 'patterns'
  },
  {
    id: 'checkerboard',
    name: 'Angled Checkers',
    icon: '🏁',
    pattern: 'linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.05)) 25%, transparent 25%), linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.05)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--pattern-color, rgba(0,0,0,0.05)) 75%), linear-gradient(-45deg, transparent 75%, var(--pattern-color, rgba(0,0,0,0.05)) 75%)',
    size: '20px 20px',
    category: 'patterns'
  },
  {
    id: 'waves-flow',
    name: 'Ocean Ripples',
    icon: '〰️',
    pattern: 'radial-gradient(circle at 50% 100%, transparent 35%, var(--pattern-color, rgba(0,0,0,0.07)) 36%, var(--pattern-color, rgba(0,0,0,0.07)) 41%, transparent 42%)',
    size: '34px 18px',
    category: 'patterns'
  },
  {
    id: 'dots-tilted',
    name: 'Diagonal Matrix',
    icon: '🎲',
    pattern: 'radial-gradient(var(--pattern-color, rgba(0,0,0,0.1)) 1.5px, transparent 1.5px), radial-gradient(var(--pattern-color, rgba(0,0,0,0.08)) 1px, transparent 1px)',
    size: '22px 22px',
    category: 'patterns'
  },
  {
    id: 'sunbeams',
    name: 'Radiant Rays',
    icon: '☀️',
    pattern: 'repeating-conic-gradient(from 0deg, var(--pattern-color, rgba(0,0,0,0.04)) 0deg 15deg, transparent 15deg 30deg)',
    size: '60px 60px',
    category: 'patterns'
  },
  {
    id: 'blueprint',
    name: 'Blueprint Paper',
    icon: '📐',
    pattern: 'linear-gradient(var(--pattern-color, rgba(0,0,0,0.09)) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color, rgba(0,0,0,0.09)) 1px, transparent 1px)',
    size: '40px 40px',
    category: 'patterns'
  },
  {
    id: 'herringbone',
    name: 'Herringbone',
    icon: '🪶',
    pattern: 'repeating-linear-gradient(45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0, var(--pattern-color, rgba(0,0,0,0.06)) 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, var(--pattern-color, rgba(0,0,0,0.06)) 0, var(--pattern-color, rgba(0,0,0,0.06)) 1px, transparent 0, transparent 50%)',
    size: '24px 24px',
    category: 'patterns'
  },
  {
    id: 'stars-cross',
    name: 'Diamond Spark',
    icon: '❇️',
    pattern: 'radial-gradient(circle at 50% 50%, var(--pattern-color, rgba(0,0,0,0.12)) 2px, transparent 3px), radial-gradient(circle at 0% 0%, var(--pattern-color, rgba(0,0,0,0.08)) 1.5px, transparent 2.5px)',
    size: '26px 26px',
    category: 'patterns'
  },
  {
    id: 'honeycomb-cells',
    name: 'Golden Cells',
    icon: '🍯',
    pattern: 'radial-gradient(circle at 50% 50%, transparent 60%, var(--pattern-color, rgba(0,0,0,0.07)) 61%, var(--pattern-color, rgba(0,0,0,0.07)) 66%, transparent 67%)',
    size: '26px 26px',
    category: 'patterns'
  },
  {
    id: 'isometric',
    name: '3D Cube Prism',
    icon: '🧊',
    pattern: 'linear-gradient(30deg, var(--pattern-color, rgba(0,0,0,0.04)) 12%, transparent 12.5%, transparent 87%, var(--pattern-color, rgba(0,0,0,0.04)) 87.5%), linear-gradient(150deg, var(--pattern-color, rgba(0,0,0,0.04)) 12%, transparent 12.5%, transparent 87%, var(--pattern-color, rgba(0,0,0,0.04)) 87.5%)',
    size: '30px 52px',
    category: 'patterns'
  },
  {
    id: 'confetti',
    name: 'Party Geometry',
    icon: '🎉',
    pattern: 'linear-gradient(135deg, var(--pattern-color, rgba(0,0,0,0.06)) 2px, transparent 2px), linear-gradient(225deg, var(--pattern-color, rgba(0,0,0,0.06)) 2px, transparent 2px)',
    size: '28px 28px',
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

// Image Backgrounds (premium CSS gradients acting as wallpapers - 38 wallpapers)
const imageBackgrounds = [
  { id: 'sunset', name: 'Sunset Glow', pattern: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)', size: 'cover', icon: '🌅', isWallpaper: true, category: 'wallpapers' },
  { id: 'aurora', name: 'Aurora Sky', pattern: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', size: 'cover', icon: '🌌', isWallpaper: true, category: 'wallpapers' },
  { id: 'magic', name: 'Magic Purple', pattern: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', size: 'cover', icon: '🔮', isWallpaper: true, category: 'wallpapers' },
  { id: 'mint', name: 'Fresh Mint', pattern: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)', size: 'cover', icon: '🍃', isWallpaper: true, category: 'wallpapers' },
  { id: 'ocean', name: 'Ocean Wave', pattern: 'linear-gradient(135deg, #2ab1e4 0%, #152585 100%)', size: 'cover', icon: '🌊', isWallpaper: true, category: 'wallpapers' },
  { id: 'darkness', name: 'Elegance Dark', pattern: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)', size: 'cover', icon: '🖤', isWallpaper: true, category: 'wallpapers' },
  { id: 'peach', name: 'Sweet Peach', pattern: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', size: 'cover', icon: '🍑', isWallpaper: true, category: 'wallpapers' },
  { id: 'cosmic-fusion', name: 'Cosmic Fusion', pattern: 'linear-gradient(135deg, #1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)', size: 'cover', icon: '🪐', isWallpaper: true, category: 'wallpapers' },
  { id: 'cyberpunk-neon', name: 'Cyber Neon', pattern: 'linear-gradient(135deg, #0575e6 0%, #00f260 50%, #ff0844 100%)', size: 'cover', icon: '🌆', isWallpaper: true, category: 'wallpapers' },
  { id: 'strawberry-creme', name: 'Strawberry Velvet', pattern: 'linear-gradient(135deg, #ff2d6c 0%, #ff6b8b 50%, #ffa8c5 100%)', size: 'cover', icon: '🍓', isWallpaper: true, category: 'wallpapers' },
  { id: 'tokyo-nightscape', name: 'Tokyo Nightscape', pattern: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', size: 'cover', icon: '🗼', isWallpaper: true, category: 'wallpapers' },
  { id: 'golden-solstice', name: 'Golden Solstice', pattern: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', size: 'cover', icon: '☀️', isWallpaper: true, category: 'wallpapers' },
  { id: 'emerald-dream', name: 'Emerald Dream', pattern: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', size: 'cover', icon: '🌲', isWallpaper: true, category: 'wallpapers' },
  { id: 'midnight-abyss', name: 'Midnight Abyss', pattern: 'linear-gradient(135deg, #09203f 0%, #537895 100%)', size: 'cover', icon: '🌌', isWallpaper: true, category: 'wallpapers' },
  { id: 'cherry-blossom', name: 'Sakura Bloom', pattern: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', size: 'cover', icon: '🌸', isWallpaper: true, category: 'wallpapers' },
  { id: 'lavender-dusk', name: 'Lavender Dusk', pattern: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', size: 'cover', icon: '🪻', isWallpaper: true, category: 'wallpapers' },
  { id: 'fire-ember', name: 'Ember Fire', pattern: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', size: 'cover', icon: '🔥', isWallpaper: true, category: 'wallpapers' },
  { id: 'royal-violet', name: 'Royal Violet', pattern: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)', size: 'cover', icon: '⚡', isWallpaper: true, category: 'wallpapers' },
  { id: 'caramel-macchiato', name: 'Caramel Macchiato', pattern: 'linear-gradient(135deg, #3e2723 0%, #6d4c41 50%, #d7ccc8 100%)', size: 'cover', icon: '☕', isWallpaper: true, category: 'wallpapers' },
  { id: 'pastel-rainbow', name: 'Pastel Horizon', pattern: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', size: 'cover', icon: '🌈', isWallpaper: true, category: 'wallpapers' },
  { id: 'arctic-glacier', name: 'Arctic Glacier', pattern: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', size: 'cover', icon: '❄️', isWallpaper: true, category: 'wallpapers' },
  { id: 'bubblegum-pop', name: 'Bubblegum Pop', pattern: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)', size: 'cover', icon: '🍬', isWallpaper: true, category: 'wallpapers' },
  { id: 'tropical-coral', name: 'Tropical Coral', pattern: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', size: 'cover', icon: '🪸', isWallpaper: true, category: 'wallpapers' },
  { id: 'obsidian-stealth', name: 'Obsidian Stealth', pattern: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', size: 'cover', icon: '🕶️', isWallpaper: true, category: 'wallpapers' },
  { id: 'dragon-nectar', name: 'Dragon Nectar', pattern: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', size: 'cover', icon: '🐉', isWallpaper: true, category: 'wallpapers' },
  { id: 'synthwave-neon', name: 'Synthwave Arcade', pattern: 'linear-gradient(135deg, #2e0854 0%, #b80058 50%, #f5a623 100%)', size: 'cover', icon: '📼', isWallpaper: true, category: 'wallpapers' },
  { id: 'enchanted-glade', name: 'Enchanted Glade', pattern: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', size: 'cover', icon: '🌿', isWallpaper: true, category: 'wallpapers' },
  { id: 'velvet-nocturne', name: 'Velvet Nocturne', pattern: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)', size: 'cover', icon: '🍷', isWallpaper: true, category: 'wallpapers' },
  { id: 'california-sunset', name: 'California Sunset', pattern: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', size: 'cover', icon: '🌴', isWallpaper: true, category: 'wallpapers' },
  { id: 'cotton-clouds', name: 'Cotton Clouds', pattern: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', size: 'cover', icon: '☁️', isWallpaper: true, category: 'wallpapers' },
  { id: 'deep-sapphire', name: 'Deep Sapphire', pattern: 'linear-gradient(135deg, #0052d4 0%, #4364f7 50%, #6fb1fc 100%)', size: 'cover', icon: '💎', isWallpaper: true, category: 'wallpapers' },
  { id: 'mango-tango', name: 'Mango Tango', pattern: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', size: 'cover', icon: '🥭', isWallpaper: true, category: 'wallpapers' },
  { id: 'dark-nebula', name: 'Dark Nebula', pattern: 'linear-gradient(135deg, #000428 0%, #004e92 100%)', size: 'cover', icon: '✨', isWallpaper: true, category: 'wallpapers' },
  { id: 'champagne-luxe', name: 'Champagne Luxe', pattern: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', size: 'cover', icon: '🥂', isWallpaper: true, category: 'wallpapers' },
  { id: 'juicy-signature', name: 'Juicy Signature', pattern: 'linear-gradient(135deg, #ff007f 0%, #ff2d6c 50%, #ff758c 100%)', size: 'cover', icon: '💖', isWallpaper: true, category: 'wallpapers' },
  { id: 'electric-cyan', name: 'Electric Cyan', pattern: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', size: 'cover', icon: '⚡', isWallpaper: true, category: 'wallpapers' },
  { id: 'velvet-peach', name: 'Velvet Peach Glow', pattern: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)', size: 'cover', icon: '🍑', isWallpaper: true, category: 'wallpapers' },
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
  { id: 'all', name: `✨ All (${allPatterns.length})` },
  { id: 'patterns', name: `📐 Patterns (${backgroundPatterns.length})` },
  { id: 'wallpapers', name: `🌈 Gradients (${imageBackgrounds.length})` },
  { id: 'custom', name: '🖼️ My Uploads' }
];

// Theme Categories
const themeCategories = [
  { id: 'all', name: `✨ All (${allAvailableThemes.length})`, themes: allAvailableThemes },
  { id: 'solid', name: `🎨 Solid (${themeOptions.length})`, themes: themeOptions },
  { id: 'gradient', name: `🌈 Gradients (${gradientThemes.length})`, themes: gradientThemes },
  { id: 'dark', name: `🌙 Dark (${darkThemes.length})`, themes: darkThemes },
  { id: 'aesthetic', name: `💖 Aesthetics (${aestheticThemes.length})`, themes: aestheticThemes }
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
    title: 'Calls & Ringtone',
    items: [
      {
        label: 'Incoming Call Ringtone',
        desc: 'Set a custom ringtone for incoming calls',
        type: 'ringtone-selector'
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
  const socket = useSocket();
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
  const [ringtoneDialogOpen, setRingtoneDialogOpen] = React.useState(false);
  const [currentRingtone, setCurrentRingtone] = React.useState(null);
  const [themeTab, setThemeTab] = React.useState('solid');
  const [themeSearchQuery, setThemeSearchQuery] = React.useState('');
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
  const [currentUserProfile, setCurrentUserProfile] = React.useState(() => {
    try {
      const cached = localStorage.getItem('profileImageCache') || localStorage.getItem('profileImage');
      const un = localStorage.getItem('username');
      return { profileImage: cached || '', username: un || '' };
    } catch (e) {
      return null;
    }
  });

  // Sync active ringtone setting
  React.useEffect(() => {
    const fetchRingtone = async () => {
      try {
        const setting = await getRingtoneSetting();
        setCurrentRingtone(setting);
      } catch (e) { }
    };
    fetchRingtone();

    const handleRingtoneChange = (e) => {
      if (e.detail) {
        setCurrentRingtone(e.detail);
      }
    };
    window.addEventListener('appRingtoneChanged', handleRingtoneChange);
    return () => {
      window.removeEventListener('appRingtoneChanged', handleRingtoneChange);
    };
  }, []);


  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [currentIsDark, setCurrentIsDark] = React.useState(() => {
    try {
      const saved = localStorage.getItem('appTheme');
      if (saved) {
        const parsed = JSON.parse(saved);
        const bgCol = parsed?.colors?.background;
        if (bgCol && bgCol.startsWith('#')) {
          const hex = bgCol.replace('#', '').trim();
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return (r * 299 + g * 587 + b * 114) / 1000 < 128;
        }
      }
    } catch (e) { }
    return theme.palette.mode === 'dark';
  });
  const isDark = currentIsDark;
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const fileInputRef = React.useRef(null);
  const rawApiBase = API_BASE_URL;
  const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

  // Load custom images and settings on mount (SQLite + localStorage instant load)
  React.useEffect(() => {
    // 1. Instant synchronous read from localStorage
    const savedCustomImages = localStorage.getItem('customWallpapers');
    if (savedCustomImages) {
      try {
        setCustomImages(JSON.parse(savedCustomImages));
      } catch (e) { }
    }

    // 2. Load and merge from SQLite database
    getCustomWallpapersLocally()
      .then(sqliteWallpapers => {
        if (Array.isArray(sqliteWallpapers) && sqliteWallpapers.length > 0) {
          setCustomImages(sqliteWallpapers);
        }
      })
      .catch(err => console.warn('SQLite custom wallpapers load notice:', err));

    // 3. Load current Theme
    const DEFAULT_THEME = {
      id: 'light',
      name: 'Light',
      description: 'Bright and clear with soft pastels',
      colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' },
      icon: '☀️'
    };
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      try {
        const themeData = JSON.parse(savedTheme);
        setSelectedTheme(themeData.id);
        applyTheme(themeData);
      } catch (e) { }
    } else {
      getAppSettingLocally('appTheme').then(themeStr => {
        if (themeStr) {
          try {
            const themeData = JSON.parse(themeStr);
            setSelectedTheme(themeData.id);
            applyTheme(themeData);
            return;
          } catch (e) { }
        }
        setSelectedTheme('light');
        saveAppSettingLocally('appTheme', JSON.stringify(DEFAULT_THEME));
        applyTheme(DEFAULT_THEME);
      });
    }

    // 4. Load Pattern / Background
    const savedPattern = localStorage.getItem('appPattern');
    if (savedPattern) {
      try {
        const patternData = JSON.parse(savedPattern);
        setSelectedPattern(patternData.id);
        applyPattern(patternData);
      } catch (e) { }
    } else {
      getAppSettingLocally('appPattern').then(patternStr => {
        if (patternStr) {
          try {
            const patternData = JSON.parse(patternStr);
            setSelectedPattern(patternData.id);
            applyPattern(patternData);
          } catch (e) { }
        }
      });
    }

    // 5. Load Opacity
    const savedOpacity = localStorage.getItem('patternOpacity');
    let isWall = false;
    if (savedPattern) {
      try {
        const patternData = JSON.parse(savedPattern);
        isWall = patternData.isWallpaper || patternData.type === 'custom-image' || patternData.type === 'image' ||
          ['sunset', 'aurora', 'magic', 'mint', 'ocean', 'darkness', 'peach'].includes(patternData.id);
      } catch (e) { }
    }
    const defaultOpacity = savedOpacity !== null ? parseInt(savedOpacity) : (isWall ? 100 : 5);
    setPatternOpacity(defaultOpacity);
    applyOpacity(defaultOpacity);

    const savedSwitchState = localStorage.getItem('settingsSwitchState');
    if (savedSwitchState) {
      try {
        setSwitchState(JSON.parse(savedSwitchState));
      } catch (e) { }
    }

    // Fetch user settings from backend
    if (userId) {
      fetch(`${API_BASE}/api/user/${userId}`)
        .then(res => res.json())
        .then(user => {
          if (user) {
            setCurrentUserProfile(user);
            if (user.profileImage) {
              localStorage.setItem('profileImageCache', user.profileImage);
              localStorage.setItem('profileImage', user.profileImage);
            }
          }
          setSwitchState(prev => ({
            ...prev,
            profileVisible: user.profileVisible !== false,
            messageEncryption: user.messageEncryption === true
          }));
        })
        .catch(err => console.warn('Network user profile fetch in settings notice:', err));
    }
  }, [userId, API_BASE]);

  // Apply theme to entire app
  const applyTheme = (themeData) => {
    if (!themeData || !themeData.colors) return;

    const root = document.documentElement;
    const isGradient = themeData.colors.primary && themeData.colors.primary.includes('gradient');
    let solidPrimary = themeData.colors.primary;
    let gradientPrimary = themeData.colors.primary;
    if (isGradient) {
      const match = themeData.colors.primary.match(/#(?:[0-9a-fA-F]{3,8})/);
      solidPrimary = match ? match[0] : '#f06292';
    } else if (solidPrimary) {
      gradientPrimary = `linear-gradient(135deg, ${solidPrimary} 0%, ${solidPrimary}dd 100%)`;
    }

    const hexToRgb = (hex) => {
      try {
        const h = (hex || '#f06292').replace('#', '').trim();
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const bigint = parseInt(full, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
      } catch (e) {
        return '240, 98, 146';
      }
    };

    const primaryRgb = hexToRgb(solidPrimary || '#f06292');

    root.style.setProperty('--primary-color', solidPrimary || '#f06292');
    root.style.setProperty('--primary-gradient', gradientPrimary || 'linear-gradient(135deg, #ff5c8d 0%, #ff2d6c 100%)');
    root.style.setProperty('--primary-rgb', primaryRgb);
    root.style.setProperty('--primary-color-alpha', `rgba(${primaryRgb}, 0.08)`);
    root.style.setProperty('--primary-color-glow', `rgba(${primaryRgb}, 0.35)`);
    root.style.setProperty('--app-primary', solidPrimary || '#f06292');
    root.style.setProperty('--app-primary-rgb', primaryRgb);
    root.style.setProperty('--background-color', themeData.colors.background);
    root.style.setProperty('--surface-color', themeData.colors.surface);
    root.style.setProperty('--text-color', themeData.colors.text);

    // Calculate background color luminance to determine if theme is dark or light
    let dark = false;
    const bgCol = themeData.colors.background;
    if (bgCol && bgCol.startsWith('#')) {
      try {
        const hex = bgCol.replace('#', '').trim();
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        dark = brightness < 128;
      } catch (e) {
        const themeIdStr = (themeData.id || '').toLowerCase();
        dark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
      }
    } else {
      const themeIdStr = (themeData.id || '').toLowerCase();
      dark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
    }
    setCurrentIsDark(dark);
    root.style.setProperty('--pattern-color', dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', solidPrimary || themeData.colors.primary);
    }
  };

  // Listen for theme change from other components/storage
  React.useEffect(() => {
    const onThemeChanged = () => {
      try {
        const saved = localStorage.getItem('appTheme');
        if (saved) {
          const themeData = JSON.parse(saved);
          setSelectedTheme(themeData.id);
          applyTheme(themeData);
        }
      } catch (e) { }
    };
    window.addEventListener('themeChanged', onThemeChanged);
    return () => window.removeEventListener('themeChanged', onThemeChanged);
  }, []);

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
    const allThemes = allAvailableThemes;
    const categoryThemes = themeCategories.find(cat => cat.id === category)?.themes || themeOptions;
    const theme = categoryThemes.find(t => t.id === themeId) || allThemes.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(themeId);
      localStorage.setItem('appTheme', JSON.stringify(theme));
      saveAppSettingLocally('appTheme', JSON.stringify(theme));

      const isGrad = theme.colors.primary && theme.colors.primary.includes('gradient');
      const solidHex = isGrad ? (theme.colors.primary.match(/#(?:[0-9a-fA-F]{3,8})/)?.[0] || '#f06292') : theme.colors.primary;
      localStorage.setItem('primaryColor', solidHex);
      localStorage.setItem('appPrimary', solidHex);
      localStorage.setItem('appPrimaryColor', solidHex);
      localStorage.setItem('app.primaryColor', solidHex);

      applyTheme(theme);
      window.dispatchEvent(new Event('themeChanged'));
      setSnackbar({
        open: true,
        message: `Theme applied: ${theme.name}`,
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

  // Handle image upload with cropping (Optimized for all mobile devices + SQLite)
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);

    try {
      // Crop the image using our mobile-optimized getCroppedImg utility
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

      // Add to SQLite database & React state
      await saveCustomWallpaperLocally(imageData);
      const updatedImages = [imageData, ...customImages.filter(img => img.id !== imageId)];
      setCustomImages(updatedImages);

      // Automatically set this wallpaper as the active background pattern in SQLite & local state
      setSelectedPattern(imageId);
      await saveAppSettingLocally('appPattern', JSON.stringify(imageData));
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
        message: error?.message || 'Failed to crop and upload image',
        severity: 'error'
      });
    }
  };


  // Handle custom image selection
  const handleCustomImageSelect = async (imageId) => {
    const image = customImages.find(img => img.id === imageId);
    if (image) {
      setSelectedPattern(imageId);
      await saveAppSettingLocally('appPattern', JSON.stringify(image));
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
  const handleCustomImageDelete = async (imageId, event) => {
    event.stopPropagation(); // Prevent pattern selection when deleting

    const updatedImages = customImages.filter(img => img.id !== imageId);
    setCustomImages(updatedImages);
    await deleteCustomWallpaperLocally(imageId);

    // If the deleted image was currently selected, revert to no pattern
    if (selectedPattern === imageId) {
      setSelectedPattern('none');
      await saveAppSettingLocally('appPattern', JSON.stringify({ id: 'none', pattern: 'none' }));
      applyPattern({ id: 'none', pattern: 'none' });
    }

    setSnackbar({
      open: true,
      message: 'Wallpaper deleted',
      severity: 'info'
    });
  };

  // Handle pattern selection (updated to support custom images + SQLite)
  const handlePatternSelect = async (patternId) => {
    // Check if it's a custom image
    if (patternId.startsWith('custom-')) {
      handleCustomImageSelect(patternId);
      return;
    }

    // Handle regular patterns
    const pattern = allPatterns.find(p => p.id === patternId);
    if (pattern) {
      setSelectedPattern(patternId);
      await saveAppSettingLocally('appPattern', JSON.stringify(pattern));
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

  // Enhanced 3D Juicy Theme Preview Component (Mobile-Optimized)
  const ThemePreview = ({ theme, category }) => {
    const isSelected = selectedTheme === theme.id;
    const isGradient = theme.colors.primary && theme.colors.primary.includes('gradient');
    const previewColor = isGradient
      ? (theme.colors.primary.match(/#(?:[0-9a-fA-F]{3,8})/)?.[0] || '#f06292')
      : theme.colors.primary;

    const isCardDark = (() => {
      const bg = theme.colors.background || '';
      if (bg.startsWith('#')) {
        const hex = bg.replace('#', '').trim();
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return (r * 299 + g * 587 + b * 114) / 1000 < 130;
      }
      return false;
    })();

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 1.15, sm: 1.5 },
          borderRadius: { xs: '18px', sm: '22px' },
          background: theme.colors.background,
          color: theme.colors.text,
          border: isSelected
            ? '2.5px solid #ff2d6c'
            : isCardDark
              ? '1.5px solid rgba(255,255,255,0.12)'
              : '1.5px solid rgba(255, 105, 150, 0.18)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isSelected
            ? '0 8px 24px -2px rgba(255, 45, 108, 0.38), 0 2px 6px rgba(0, 0, 0, 0.08)'
            : isCardDark
              ? '0 3px 12px rgba(0,0,0,0.3)'
              : '0 3px 12px -2px rgba(240, 98, 146, 0.12), 0 1px 4px rgba(0,0,0,0.02)',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isSelected
                ? '0 12px 28px -2px rgba(255, 45, 108, 0.48)'
                : '0 8px 20px -2px rgba(240, 98, 146, 0.2)'
            }
          },
          '&:active': {
            transform: 'scale(0.975)'
          }
        }}
        onClick={() => handleThemeSelect(theme.id, category)}
      >
        {/* Top glossy specular reflection */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            borderTopLeftRadius: { xs: '18px', sm: '22px' },
            borderTopRightRadius: { xs: '18px', sm: '22px' }
          }}
        />

        {/* Left Side: 3D Icon & Live Palette Swatch */}
        <Box
          sx={{
            width: { xs: 42, sm: 48 },
            height: { xs: 42, sm: 48 },
            borderRadius: { xs: '13px', sm: '15px' },
            background: theme.colors.surface,
            border: isCardDark ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mr: { xs: 1.2, sm: 1.6 },
            flexShrink: 0,
            position: 'relative'
          }}
        >
          <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.38rem' }, lineHeight: 1 }}>
            {theme.icon}
          </Typography>
          {/* Small primary color accent badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: { xs: 12, sm: 14 },
              height: { xs: 12, sm: 14 },
              borderRadius: '50%',
              background: theme.colors.primary,
              border: '2px solid #ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
            }}
          />
        </Box>

        {/* Center Section: Title, Tag, Description, Color Dots */}
        <Box sx={{ minWidth: 0, flex: 1, mr: { xs: 0.8, sm: 1.2 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.15, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 750,
                fontSize: { xs: '0.85rem', sm: '0.94rem' },
                color: theme.colors.text,
                lineHeight: 1.2
              }}
            >
              {theme.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.58rem',
                fontWeight: 700,
                px: 0.55,
                py: 0.08,
                borderRadius: '5px',
                bgcolor: isCardDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                color: theme.colors.text,
                opacity: 0.85,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                flexShrink: 0
              }}
            >
              {isCardDark ? 'Dark' : 'Light'}
            </Typography>
          </Box>

          <Typography
            noWrap
            sx={{
              fontSize: { xs: '0.68rem', sm: '0.75rem' },
              color: theme.colors.text,
              opacity: 0.76,
              mb: 0.45,
              lineHeight: 1.2
            }}
          >
            {theme.description}
          </Typography>

          {/* 4 Color Palette Dots */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {Object.values(theme.colors).slice(0, 4).map((color, idx) => (
              <Box
                key={idx}
                sx={{
                  width: { xs: 11, sm: 13 },
                  height: { xs: 11, sm: 13 },
                  borderRadius: '50%',
                  background: color,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  border: isCardDark ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(0,0,0,0.12)'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Right Side: Active Status Badge or Subtle Radio Indicator */}
        <Box sx={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {isSelected ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.35,
                px: { xs: 1, sm: 1.3 },
                py: 0.35,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ff2d6c 0%, #ff6596 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: { xs: '0.64rem', sm: '0.7rem' },
                boxShadow: '0 3px 10px rgba(255, 45, 108, 0.45)',
                border: '1px solid rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: { xs: 11, sm: 13 } }} />
              <span>Active</span>
            </Box>
          ) : (
            <Box
              sx={{
                width: { xs: 18, sm: 20 },
                height: { xs: 18, sm: 20 },
                borderRadius: '50%',
                border: isCardDark ? '2px solid rgba(255,255,255,0.22)' : '2px solid rgba(0,0,0,0.18)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#ff2d6c'
                }
              }}
            />
          )}
        </Box>
      </Box>
    );
  };

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

    const isSelected = selectedPattern === pattern.id;

    return (
      <Box
        sx={{
          p: isCustomImage ? 0 : 2.5,
          borderRadius: '20px',
          bgcolor: 'var(--surface-color)',
          color: 'var(--text-color)',
          border: isSelected
            ? '2.5px solid #ff2d6c'
            : isDark
              ? '1.5px solid rgba(255,255,255,0.12)'
              : '1.5px solid rgba(255,105,150,0.18)',
          cursor: 'pointer',
          transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 95, sm: 110 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isCustomImage ? 'flex-end' : 'center',
          alignItems: 'center',
          boxShadow: isSelected
            ? '0 8px 24px -2px rgba(255, 45, 108, 0.4), 0 2px 8px rgba(0, 0, 0, 0.08)'
            : '0 4px 14px rgba(0,0,0,0.06)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isSelected
                ? '0 12px 28px -2px rgba(255, 45, 108, 0.5)'
                : '0 8px 22px rgba(255, 45, 108, 0.18)'
            }
          },
          '&:active': {
            transform: 'scale(0.97)'
          },
          ...getPatternStyle()
        }}
        onClick={() => handlePatternSelect(pattern.id)}
      >
        {/* Top glossy specular reflection */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '42%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px'
          }}
        />

        {/* Overlay for custom images */}
        {isCustomImage && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              p: 1
            }}
          >
            <Typography
              variant="body2"
              fontWeight="600"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                px: 1.2,
                py: 0.2,
                borderRadius: '8px',
                fontSize: '0.72rem',
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
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.45)',
                pointerEvents: 'none'
              }}
            />

            <Typography variant="h4" sx={{ mb: 0.8, position: 'relative', zIndex: 1, fontSize: { xs: '1.6rem', sm: '1.85rem' } }}>
              {pattern.icon}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="650"
              noWrap
              sx={{
                position: 'relative',
                zIndex: 1,
                backgroundColor: isDark ? 'rgba(20, 15, 30, 0.82)' : 'rgba(255, 255, 255, 0.88)',
                color: isDark ? '#ffffff' : '#1e1b2e',
                px: 1.2,
                py: 0.2,
                borderRadius: '8px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                maxWidth: '92%',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {pattern.name}
            </Typography>
          </>
        )}

        {/* Active Checkmark Pill Badge */}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff2d6c 0%, #ff6596 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(255, 45, 108, 0.5)',
              border: '1.5px solid #ffffff'
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
        )}

        {/* Delete button for custom images */}
        {isCustomImage && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 3,
              backgroundColor: 'rgba(239, 68, 68, 0.85)',
              color: 'white',
              p: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 1)'
              }
            }}
            onClick={(e) => handleCustomImageDelete(pattern.id, e)}
          >
            <DeleteIcon sx={{ fontSize: 15 }} />
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
    saveAppSettingLocally('patternOpacity', newValue.toString());
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
      }).catch(() => { });
    } catch (e) { }

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
        bgcolor: 'var(--background-color, #fff7f9)',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
          : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        overflow: 'hidden'
      }}>
        <Help onBack={() => setShowHelp(false)} />
      </Box>
    );
  }

  // FIXED: If showing edit profile, render it with proper layout (no extra gap)
  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
    try {
      const cached = localStorage.getItem('profileImageCache') || localStorage.getItem('profileImage');
      const un = localStorage.getItem('username');
      setCurrentUserProfile(prev => ({ ...prev, profileImage: cached || '', username: un || prev?.username }));
    } catch (e) { }
  };

  if (showEditProfile) {
    return (
      <Box data-settings-subview="true" sx={{
        height: '100dvh',
        width: '100%',
        bgcolor: 'var(--background-color, #fff7f9)',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
          : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        overflow: 'hidden'
      }}>
        {/* EditProfile Component - rendered directly without extra padding */}
        <EditProfile onBack={handleCloseEditProfile} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'var(--background-color, #fff7f9)',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
          : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: isMobile ? '100%' : 880,
          mx: 'auto',
          height: '100%',
          bgcolor: 'transparent',
          overflowY: 'auto',
          pt: { xs: 2, sm: 3.5 },
          pb: { xs: 12, sm: 8 },
          px: { xs: 2, sm: 3.5 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
          /* Clean scrollable area without sidebar/scrollbar */
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            px: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '16px',
                background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <SettingsIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: isDark
                    ? 'linear-gradient(135deg, #ffffff 0%, var(--primary-color, #fda4af) 100%)'
                    : 'linear-gradient(135deg, var(--text-color, #1e1b2e) 0%, var(--primary-color, #ff2d6c) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  fontSize: isMobile ? '1.35rem' : '1.55rem'
                }}
              >
                Settings
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                Customize your chat experience & preferences
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User Profile Summary Card */}
        <Box
          onClick={() => setShowEditProfile(true)}
          sx={{
            mb: 2.5,
            p: { xs: 1.8, sm: 2.2 },
            borderRadius: '24px',
            bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.22s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.35))',
              boxShadow: isDark
                ? '0 12px 28px rgba(0, 0, 0, 0.45)'
                : '0 12px 28px rgba(255, 45, 108, 0.1)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Avatar
              src={getProfileImageSrc(currentUserProfile?.profileImage)}
              sx={{
                width: 54,
                height: 54,
                border: '2px solid var(--primary-color, #ff2d6c)',
                boxShadow: '0 4px 14px rgba(255, 45, 108, 0.25)',
                bgcolor: isDark ? 'rgba(255, 45, 108, 0.2)' : '#ffe4ec',
                color: 'var(--primary-color, #ff2d6c)',
                fontWeight: 700,
                fontSize: '1.25rem',
                flexShrink: 0
              }}
            >
              {(currentUserProfile?.name?.[0] || currentUserProfile?.username?.[0] || 'U').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 750,
                  fontSize: '1.02rem',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  lineHeight: 1.2
                }}
              >
                {currentUserProfile?.name || currentUserProfile?.username || 'User Profile'}
              </Typography>
              <Typography
                noWrap
                variant="body2"
                sx={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.84rem',
                  mt: 0.3
                }}
              >
                {currentUserProfile?.username ? `@${currentUserProfile.username}` : (currentUserProfile?.email || 'Tap to edit profile')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            sx={{
              color: 'var(--primary-color, #ff2d6c)',
              p: 1,
              pointerEvents: 'none'
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Sections */}
        {settingsSections.map((section) => (
          <Box
            key={section.title}
            sx={{
              mb: 2.5,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              p: { xs: 2, sm: 2.5 },
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
              boxShadow: isDark
                ? '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                : '0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              transition: 'all 0.25s ease'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 750,
                mb: 1.5,
                fontSize: '0.95rem',
                letterSpacing: '-0.2px',
                color: 'var(--primary-color, #ff2d6c)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
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
                  if (item.type === 'ringtone-selector') return () => setRingtoneDialogOpen(true);
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
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.4,
                        px: 1.2,
                        cursor: item.type === 'switch' ? 'pointer' : item.type || item.label ? 'pointer' : 'default',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      <Box sx={{ flex: 1, pr: 1.5 }}>
                        <Typography sx={{ fontWeight: 650, fontSize: '0.96rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.84rem', mt: 0.3, lineHeight: 1.4 }}>
                          {item.desc}
                        </Typography>
                      </Box>

                      {/* Theme selector */}
                      {item.type === 'theme-selector' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            size="small"
                            label={allAvailableThemes.find(t => t.id === selectedTheme)?.name || 'Light'}
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              height: 24,
                              borderRadius: '10px',
                              bgcolor: isDark ? 'rgba(255, 45, 108, 0.18)' : 'rgba(255, 45, 108, 0.1)',
                              color: 'var(--primary-color, #ff2d6c)',
                              border: '1px solid rgba(255, 45, 108, 0.25)',
                              pointerEvents: 'none',
                              maxWidth: 120,
                              '& .MuiChip-label': {
                                px: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }
                            }}
                          />
                          <IconButton
                            sx={{
                              color: '#ffffff',
                              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              borderRadius: '12px',
                              p: 1,
                              pointerEvents: 'none'
                            }}
                          >
                            <PaletteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) :
                        /* Pattern selector */
                        item.type === 'pattern-selector' ? (
                          <IconButton
                            sx={{
                              color: '#ffffff',
                              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              borderRadius: '12px',
                              p: 1,
                              pointerEvents: 'none'
                            }}
                          >
                            <TextureIcon fontSize="small" />
                          </IconButton>
                        ) :
                          /* Opacity slider */
                          item.type === 'opacity-slider' ? (
                            <IconButton
                              sx={{
                                color: '#ffffff',
                                background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                borderRadius: '12px',
                                p: 1,
                                pointerEvents: 'none'
                              }}
                            >
                              <OpacityIcon fontSize="small" />
                            </IconButton>
                          ) :
                            /* Ringtone selector */
                            item.type === 'ringtone-selector' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  size="small"
                                  label={
                                    currentRingtone?.type === 'custom'
                                      ? (currentRingtone.customAudio?.title || 'Custom')
                                      : 'Default'
                                  }
                                  sx={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    height: 24,
                                    borderRadius: '10px',
                                    bgcolor: isDark ? 'rgba(255, 45, 108, 0.18)' : 'rgba(255, 45, 108, 0.1)',
                                    color: 'var(--primary-color, #ff2d6c)',
                                    border: '1px solid rgba(255, 45, 108, 0.25)',
                                    pointerEvents: 'none',
                                    maxWidth: 130,
                                    '& .MuiChip-label': {
                                      px: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }
                                  }}
                                />
                                <IconButton
                                  sx={{
                                    color: '#ffffff',
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    borderRadius: '12px',
                                    p: 1,
                                    pointerEvents: 'none'
                                  }}
                                >
                                  <MusicNoteRoundedIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) :
                              /* Switch */
                              item.type === 'switch' ? (
                                <Switch
                                  checked={switchState[item.key]}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleSwitch(item.key);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: 'var(--primary-color, #ff2d6c)'
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      bgcolor: 'var(--primary-color, #ff8da1)',
                                      opacity: 0.6
                                    }
                                  }}
                                />
                              ) : (
                                <IconButton
                                  sx={{ color: 'var(--primary-color, #ff2d6c)', p: 1, pointerEvents: 'none' }}
                                >
                                  <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              )}
                    </Box>
                    {i < section.items.length - 1 && (
                      <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)' }} />
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
            fullWidth={isMobile}
            sx={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              bgcolor: 'rgba(239, 68, 68, 0.06)',
              color: '#ef4444',
              fontWeight: 650,
              borderRadius: '20px',
              py: 1.3,
              textTransform: 'none',
              fontSize: '0.92rem',
              transition: 'all 0.22s ease',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: '#ef4444',
                color: '#dc2626',
                transform: 'translateY(-1px)'
              }
            }}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
          <Button
            variant="contained"
            sx={{
              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '20px',
              py: 1.3,
              fontSize: '0.92rem',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
              textTransform: 'none',
              transition: 'all 0.22s ease',
              '&:hover': {
                filter: 'brightness(1.08)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                transform: 'translateY(-2px)'
              }
            }}
            fullWidth={isMobile}
            onClick={async () => {
              const currentUserId = userId || localStorage.getItem('userId');

              // 1. Clear native AudioRoute session
              if (typeof window !== 'undefined' && window.Capacitor) {
                const { AudioRoute } = window.Capacitor.Plugins || {};
                if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
                  try {
                    await AudioRoute.clearSession();
                  } catch (e) { }
                }
              }

              // 2. Disconnect socket session immediately
              if (socket) {
                try {
                  if (currentUserId) socket.emit('logout', { userId: currentUserId });
                  socket.disconnect();
                } catch (e) {
                  console.warn('Socket disconnect error:', e);
                }
              }

              // 3. Clear all user localstorage & localmemory (sessionStorage)
              try {
                const savedTheme = localStorage.getItem('appTheme');
                localStorage.clear();
                if (savedTheme) {
                  localStorage.setItem('appTheme', savedTheme);
                }
              } catch (e) {
                console.warn('LocalStorage clear error:', e);
              }

              try {
                sessionStorage.clear();
              } catch (e) { }

              // 4. Dispatch logout events
              try {
                window.dispatchEvent(new CustomEvent('juicy_user_logged_out', { detail: { userId: currentUserId } }));
                window.dispatchEvent(new Event('storage'));
              } catch (e) { }

              // 5. Instantly navigate to SignInPage
              navigate('/signin', { replace: true });
              setTimeout(() => {
                if (window.location.pathname !== '/signin') {
                  window.location.replace('/signin');
                }
              }, 150);
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* 3D Juicy Theme Selection Dialog - Ultra Mobile-Optimized Bottom Sheet */}
      <Dialog
        open={themeDialogOpen}
        onClose={() => {
          setThemeDialogOpen(false);
          setThemeSearchQuery('');
        }}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: { xs: 'flex-end', sm: 'center' },
            justifyContent: 'center',
            p: { xs: 0, sm: 2 }
          },
          '& .MuiDialog-paper': {
            borderRadius: { xs: '28px 28px 0 0', sm: '32px' },
            m: { xs: 0, sm: 'auto' },
            width: { xs: '100%', sm: '90%', md: '720px' },
            maxWidth: { xs: '100%', sm: '90%', md: '720px' },
            maxHeight: { xs: '88dvh', sm: '86vh' },
            background: isDark
              ? 'linear-gradient(160deg, #1c1427 0%, #150f20 100%)'
              : 'linear-gradient(160deg, #ffffff 0%, #fff7fa 100%)',
            color: 'var(--text-color)',
            border: isDark ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(255,105,150,0.22)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25), 0 25px 70px -10px rgba(255, 45, 108, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        {/* Mobile Pull Handle Indicator */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            alignItems: 'center',
            pt: 1.2,
            pb: 0.3,
            background: isDark ? 'rgba(28, 20, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 4,
              borderRadius: '2px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)'
            }}
          />
        </Box>

        {/* Sticky 3D Glass Header */}
        <Box
          sx={{
            p: { xs: 1.2, sm: 2 },
            pb: { xs: 0.8, sm: 1.2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,105,150,0.15)',
            background: isDark ? 'rgba(28, 20, 39, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.4 }, minWidth: 0, flex: 1, mr: 1 }}>
            <Box
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff2d6c 0%, #ff758c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px -2px rgba(255, 45, 108, 0.4), inset 0 1px 1px rgba(255,255,255,0.5)',
                color: '#fff',
                flexShrink: 0
              }}
            >
              <PaletteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'nowrap' }}>
                <Typography
                  noWrap
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.02rem', sm: '1.25rem' },
                    letterSpacing: '-0.02em',
                    color: isDark ? '#fff' : '#2b1736',
                    lineHeight: 1.2
                  }}
                >
                  Choose Theme
                </Typography>
                <Box
                  sx={{
                    px: 0.8,
                    py: 0.15,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(255, 45, 108, 0.12), rgba(255, 117, 140, 0.15))',
                    border: '1px solid rgba(255, 45, 108, 0.25)',
                    color: '#ff2d6c',
                    fontWeight: 800,
                    fontSize: { xs: '0.62rem', sm: '0.66rem' },
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  100+ Themes
                </Box>
              </Box>
              <Typography
                noWrap
                variant="caption"
                sx={{
                  color: isDark ? '#a090b0' : '#8b738e',
                  fontWeight: 600,
                  fontSize: { xs: '0.68rem', sm: '0.75rem' },
                  display: 'block',
                  lineHeight: 1.2,
                  mt: 0.2
                }}
              >
                Tap any theme to preview instantly
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={() => {
              setThemeDialogOpen(false);
              setThemeSearchQuery('');
            }}
            sx={{
              width: { xs: 34, sm: 38 },
              height: { xs: 34, sm: 38 },
              borderRadius: '50%',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 105, 150, 0.08)',
              color: isDark ? '#fff' : '#7a677d',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,105,150,0.15)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              '&:hover': {
                background: 'rgba(255, 45, 108, 0.15)',
                color: '#ff2d6c',
                transform: 'scale(1.06)'
              },
              '&:active': {
                transform: 'scale(0.92)'
              }
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>
        </Box>

        {/* Real-time Theme Search Bar */}
        <Box sx={{ px: { xs: 1.2, sm: 2 }, pt: 1, pb: 0.6 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={isMobile ? "Search 100+ themes..." : "Search 100+ themes (e.g. pink, sunset, dark)..."}
            value={themeSearchQuery}
            onChange={(e) => setThemeSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#ff2d6c', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: themeSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setThemeSearchQuery('')}>
                    <CloseRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: '16px',
                height: { xs: 38, sm: 42 },
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 105, 150, 0.05)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,105,150,0.15)',
                fontSize: '0.82rem',
                color: isDark ? '#fff' : '#2b1736',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 105, 150, 0.08)'
                }
              }
            }}
          />
        </Box>

        {/* 3D Capsule Category Tabs — sticky, no vertical scroll */}
        <Box
          sx={{
            px: { xs: 1.2, sm: 2 },
            pb: { xs: 1.0, sm: 1.2 },
            pt: { xs: 0.9, sm: 0.8 },
            display: 'flex',
            flexShrink: 0,           // ← never squish vertically
            alignItems: 'center',
            gap: 0.8,
            overflowX: 'auto',       // ← horizontal scroll only
            overflowY: 'visible',    // ← buttons not clipped top/bottom
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            // Sticky so it doesn't scroll with the theme grid
            position: 'sticky',
            top: 0,
            zIndex: 5,
            background: isDark ? 'rgba(28, 20, 39, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(255, 105, 150, 0.1)',
          }}
        >
          {themeCategories.map(category => {
            const isCatActive = themeTab === category.id;
            return (
              <Button
                key={category.id}
                onClick={() => setThemeTab(category.id)}
                sx={{
                  flexShrink: 0,
                  borderRadius: '16px',
                  px: { xs: 1.5, sm: 1.8 },
                  py: { xs: 0.75, sm: 0.8 },
                  minHeight: { xs: 34, sm: 36 },
                  fontSize: { xs: '0.74rem', sm: '0.82rem' },
                  fontWeight: isCatActive ? 750 : 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  color: isCatActive ? '#ffffff' : (isDark ? '#d0c4de' : '#6b586e'),
                  background: isCatActive
                    ? 'linear-gradient(135deg, #ff2d6c 0%, #ff6596 100%)'
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 105, 150, 0.08)'),
                  border: isCatActive
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,105,150,0.15)'),
                  boxShadow: isCatActive
                    ? '0 3px 10px rgba(255, 45, 108, 0.35), inset 0 1px 1px rgba(255,255,255,0.4)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  '&:hover': {
                    background: isCatActive
                      ? 'linear-gradient(135deg, #ff1a60 0%, #ff5c90 100%)'
                      : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255, 105, 150, 0.15)'),
                    transform: 'scale(1.02)'
                  },
                  '&:active': {
                    transform: 'scale(0.96)'
                  }
                }}
              >
                {category.name}
              </Button>
            );
          })}
        </Box>

        {/* Responsive Theme Cards Grid */}
        <DialogContent
          sx={{
            p: { xs: 1.2, sm: 2 },
            pt: 0.5,
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {(() => {
            let list = [];
            if (themeTab === 'all') {
              list = allAvailableThemes;
            } else {
              const cat = themeCategories.find(c => c.id === themeTab);
              list = cat?.themes || themeOptions;
            }
            if (themeSearchQuery.trim()) {
              const q = themeSearchQuery.toLowerCase().trim();
              const filtered = list.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q)
              );
              if (filtered.length === 0 && themeTab !== 'all') {
                list = allAvailableThemes.filter(t =>
                  t.name.toLowerCase().includes(q) ||
                  t.description.toLowerCase().includes(q) ||
                  t.id.toLowerCase().includes(q)
                );
              } else {
                list = filtered;
              }
            }

            if (list.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 5, color: isDark ? '#a090b0' : '#8b738e' }}>
                  <Typography variant="h6" sx={{ fontWeight: 750, fontSize: '1.05rem', mb: 0.5 }}>
                    No themes found
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                    Try searching for something else like "pink", "sunset", or "dark"
                  </Typography>
                </Box>
              );
            }

            return (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)'
                  },
                  gap: { xs: 1, sm: 1.4 }
                }}
              >
                {list.map(t => (
                  <ThemePreview key={t.id} theme={t} category={themeTab} />
                ))}
              </Box>
            );
          })()}
        </DialogContent>

        {/* Sticky 3D Glass Footer */}
        <DialogActions
          sx={{
            p: { xs: 1.2, sm: 2 },
            py: { xs: 1, sm: 1.2 },
            pb: { xs: 'calc(10px + env(safe-area-inset-bottom, 8px))', sm: 1.3 },
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,105,150,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(28, 20, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 10
          }}
        >
          {(() => {
            const curTheme = allAvailableThemes.find(t => t.id === selectedTheme) || themeOptions[0];
            const isGrad = curTheme?.colors?.primary?.includes('gradient');
            const dotCol = isGrad ? '#ff2d6c' : (curTheme?.colors?.primary || '#ff2d6c');
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, flex: 1, mr: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: dotCol,
                    boxShadow: `0 0 8px ${dotCol}`,
                    border: '2px solid #ffffff',
                    flexShrink: 0
                  }}
                />
                <Typography
                  noWrap
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    color: isDark ? '#eee' : '#3a253f',
                    fontSize: { xs: '0.78rem', sm: '0.82rem' }
                  }}
                >
                  Current: {curTheme?.name || 'Light'}
                </Typography>
              </Box>
            );
          })()}

          <Button
            variant="contained"
            onClick={() => {
              setThemeDialogOpen(false);
              setThemeSearchQuery('');
            }}
            sx={{
              borderRadius: '20px',
              px: { xs: 2.8, sm: 3.5 },
              py: { xs: 0.7, sm: 0.85 },
              background: 'linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%)',
              color: '#ffffff',
              fontWeight: 750,
              textTransform: 'none',
              fontSize: { xs: '0.84rem', sm: '0.88rem' },
              boxShadow: '0 4px 14px -2px rgba(255, 45, 108, 0.42), inset 0 1px 1px rgba(255,255,255,0.4)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff1a60 0%, #ff4b80 100%)',
                boxShadow: '0 6px 18px -2px rgba(255, 45, 108, 0.55)',
                transform: 'scale(1.03)'
              },
              '&:active': {
                transform: 'scale(0.96)'
              }
            }}
          >
            Done
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
          '& .MuiDialog-container': {
            alignItems: { xs: 'flex-end', sm: 'center' },
            justifyContent: 'center',
            p: { xs: 0, sm: 2 }
          },
          '& .MuiDialog-paper': {
            borderRadius: { xs: '28px 28px 0 0', sm: '28px' },
            m: { xs: 0, sm: 'auto' },
            width: { xs: '100%', sm: '90%', md: '900px' },
            maxWidth: { xs: '100%', sm: '90%', md: '900px' },
            background: isDark ? '#1a1424' : '#ffffff',
            color: 'var(--text-color)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,105,150,0.2)',
            boxShadow: '0 24px 60px rgba(255, 45, 108, 0.18)',
            maxHeight: { xs: '88dvh', sm: '90vh' }
          }
        }}
      >
        {/* Mobile Pull Handle */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            alignItems: 'center',
            pt: 1.2,
            pb: 0.3
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 4,
              borderRadius: '2px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)'
            }}
          />
        </Box>

        <DialogTitle sx={{
          color: 'var(--primary-color)',
          fontWeight: 700,
          borderBottom: '1px solid var(--primary-color)',
          opacity: 0.9,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          p: { xs: 1.5, sm: 2 }
        }}>
          <span>Choose Background</span>
          <Button
            startIcon={<AddPhotoAlternateIcon />}
            variant="contained"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            sx={{
              bgcolor: '#1c67ca',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 650,
              fontSize: '0.8rem',
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
            borderRadius: '28px',
            background: isDark ? '#1a1424' : '#ffffff',
            color: 'var(--text-color)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,105,150,0.2)',
            boxShadow: '0 24px 60px rgba(255, 45, 108, 0.18)'
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
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            color: 'var(--text-color)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,105,150,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ color: '#ef4444', fontWeight: 750, fontSize: '1.25rem' }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: isDark ? '#94a3b8' : '#64748b' }}>
            Type <b style={{ color: isDark ? '#ffffff' : '#000000' }}>Delete My Account</b> to confirm. This action cannot be undone.
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
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff6f6',
                fontFamily: 'Poppins',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: '#ef4444'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ef4444'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 650,
              px: 2
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
                      } catch (e) { }
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
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.45)'
              }
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

      {/* App Tutorial & User Guide Modal (Feature Catalog) */}
      <FeatureCatalogModal
        open={showTutorialGuide}
        onClose={() => setShowTutorialGuide(false)}
        isDarkTheme={isDark}
      />

      {/* Incoming Call Ringtone Modal */}
      <RingtoneModal
        open={ringtoneDialogOpen}
        onClose={() => setRingtoneDialogOpen(false)}
        isDark={isDark}
        onShowSnackbar={(message, severity = 'success') =>
          setSnackbar({ open: true, message, severity })
        }
      />
    </Box>
  );
};

export default Settings;