import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog, Box, Button, Typography, Tabs, Tab, TextField, Slider, Chip, IconButton, useTheme, useMediaQuery, Slide
} from '@mui/material';
import {
  Close as CloseIcon, Send as SendIcon, RotateLeft as RotateLeftIcon, RotateRight as RotateRightIcon,
  Crop as CropIcon, Delete as DeleteIcon,
  FormatBold as FormatBoldIcon, FormatItalic as FormatItalicIcon, FormatUnderlined as FormatUnderlinedIcon
} from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import LayersIcon from '@mui/icons-material/Layers';
import NearMeIcon from '@mui/icons-material/NearMe';
import TransformIcon from '@mui/icons-material/Transform';
import TuneIcon from '@mui/icons-material/Tune';
import Crop from './Crop';
import { generateUniqueId } from './utils/uniqueIdGenerator';

const stickerElements = [
  { id: 1, name: '😂 Face with Tears of Joy', emoji: '😂', type: 'emoji' },
  { id: 2, name: '❤️ Red Heart', emoji: '❤️', type: 'emoji' },
  { id: 3, name: '😭 Loudly Crying Face', emoji: '😭', type: 'emoji' },
  { id: 4, name: '🔥 Fire', emoji: '🔥', type: 'emoji' },
  { id: 5, name: '😊 Smiling Face', emoji: '😊', type: 'emoji' },
  { id: 6, name: '👍 Thumbs Up', emoji: '👍', type: 'emoji' },
  { id: 7, name: '🎉 Party Popper', emoji: '🎉', type: 'emoji' },
  { id: 8, name: '😍 Heart Eyes', emoji: '😍', type: 'emoji' },
  { id: 9, name: '🙏 Folded Hands', emoji: '🙏', type: 'emoji' },
  { id: 10, name: '💀 Skull', emoji: '💀', type: 'emoji' },
  { id: 11, name: '😘 Face Blowing a Kiss', emoji: '😘', type: 'emoji' },
  { id: 12, name: '🥰 Smiling Face with Hearts', emoji: '🥰', type: 'emoji' },
  { id: 13, name: '😅 Grinning Face with Sweat', emoji: '😅', type: 'emoji' },
  { id: 14, name: '🤣 Rolling on the Floor Laughing', emoji: '🤣', type: 'emoji' },
  { id: 15, name: '🤔 Thinking Face', emoji: '🤔', type: 'emoji' },
  { id: 16, name: '👏 Clapping Hands', emoji: '👏', type: 'emoji' },
  { id: 17, name: '😢 Crying Face', emoji: '😢', type: 'emoji' },
  { id: 18, name: '😎 Smiling Face with Sunglasses', emoji: '😎', type: 'emoji' },
  { id: 19, name: '✨ Sparkles', emoji: '✨', type: 'emoji' },
  { id: 20, name: '😩 Weary Face', emoji: '😩', type: 'emoji' },
  { id: 21, name: '🙌 Raising Hands', emoji: '🙌', type: 'emoji' },
  { id: 22, name: '🥺 Pleading Face', emoji: '🥺', type: 'emoji' },
  { id: 23, name: '💯 Hundred Points', emoji: '💯', type: 'emoji' },
  { id: 24, name: '😡 Pouting Face', emoji: '😡', type: 'emoji' },
  { id: 25, name: '😱 Face Screaming in Fear', emoji: '😱', type: 'emoji' },
  { id: 26, name: '🤦 Person Facepalming', emoji: '🤦', type: 'emoji' },
  { id: 27, name: '🤷 Person Shrugging', emoji: '🤷', type: 'emoji' },
  { id: 28, name: '🎂 Birthday Cake', emoji: '🎂', type: 'emoji' },
  { id: 29, name: '✅ Check Mark', emoji: '✅', type: 'emoji' },
  { id: 30, name: '🥳 Partying Face', emoji: '🥳', type: 'emoji' },
  { id: 31, name: '😴 Sleeping Face', emoji: '😴', type: 'emoji' },
  { id: 32, name: '🤩 Star-Struck', emoji: '🤩', type: 'emoji' },
  { id: 33, name: '🥶 Cold Face', emoji: '🥶', type: 'emoji' },
  { id: 34, name: '🤯 Exploding Head', emoji: '🤯', type: 'emoji' },
  { id: 35, name: '😳 Flushed Face', emoji: '😳', type: 'emoji' },
  { id: 36, name: '🥵 Hot Face', emoji: '🥵', type: 'emoji' },
  { id: 37, name: '🤪 Zany Face', emoji: '🤪', type: 'emoji' },
  { id: 38, name: '😏 Smirking Face', emoji: '😏', type: 'emoji' },
  { id: 39, name: '🤫 Shushing Face', emoji: '🤫', type: 'emoji' },
  { id: 40, name: '🤥 Lying Face', emoji: '🤥', type: 'emoji' },
  { id: 41, name: '😈 Smiling Face with Horns', emoji: '😈', type: 'emoji' },
  { id: 42, name: '👻 Ghost', emoji: '👻', type: 'emoji' },
  { id: 43, name: '👽 Alien', emoji: '👽', type: 'emoji' },
  { id: 44, name: '🤖 Robot', emoji: '🤖', type: 'emoji' },
  { id: 45, name: '💩 Pile of Poo', emoji: '💩', type: 'emoji' },
  { id: 46, name: '🎃 Jack-O-Lantern', emoji: '🎃', type: 'emoji' },
  { id: 47, name: '👑 Crown', emoji: '👑', type: 'emoji' },
  { id: 48, name: '💍 Ring', emoji: '💍', type: 'emoji' },
  { id: 49, name: '🌹 Rose', emoji: '🌹', type: 'emoji' },
  { id: 50, name: '🌻 Sunflower', emoji: '🌻', type: 'emoji' },
  { id: 51, name: '🍕 Pizza', emoji: '🍕', type: 'emoji' },
  { id: 52, name: '🍔 Hamburger', emoji: '🍔', type: 'emoji' },
  { id: 53, name: '🍦 Soft Ice Cream', emoji: '🍦', type: 'emoji' },
  { id: 54, name: '☕ Hot Beverage', emoji: '☕', type: 'emoji' },
  { id: 55, name: '🍻 Clinking Beer Mugs', emoji: '🍻', type: 'emoji' },
  { id: 56, name: '🎮 Video Game', emoji: '🎮', type: 'emoji' },
  { id: 57, name: '⚽ Soccer Ball', emoji: '⚽', type: 'emoji' },
  { id: 58, name: '🏀 Basketball', emoji: '🏀', type: 'emoji' },
  { id: 59, name: '🎸 Guitar', emoji: '🎸', type: 'emoji' },
  { id: 60, name: '🎵 Musical Note', emoji: '🎵', type: 'emoji' },
  { id: 61, name: '📱 Mobile Phone', emoji: '📱', type: 'emoji' },
  { id: 62, name: '💻 Laptop', emoji: '💻', type: 'emoji' },
  { id: 63, name: '💰 Money Bag', emoji: '💰', type: 'emoji' },
  { id: 64, name: '✈️ Airplane', emoji: '✈️', type: 'emoji' },
  { id: 65, name: '🚗 Automobile', emoji: '🚗', type: 'emoji' },
  { id: 66, name: '⭐ Star', emoji: '⭐', type: 'emoji' },
  { id: 67, name: '🌈 Rainbow', emoji: '🌈', type: 'emoji' },
  { id: 68, name: '🌙 Crescent Moon', emoji: '🌙', type: 'emoji' },
  { id: 69, name: '☀️ Sun', emoji: '☀️', type: 'emoji' },
  { id: 70, name: '⛄ Snowman', emoji: '⛄', type: 'emoji' },
  { id: 71, name: '🎁 Wrapped Gift', emoji: '🎁', type: 'emoji' },
  { id: 72, name: '🎈 Balloon', emoji: '🎈', type: 'emoji' },
  { id: 73, name: '🎊 Confetti Ball', emoji: '🎊', type: 'emoji' },
  { id: 74, name: '🏆 Trophy', emoji: '🏆', type: 'emoji' },
  { id: 75, name: '⚡ High Voltage', emoji: '⚡', type: 'emoji' },
  { id: 76, name: '💥 Collision', emoji: '💥', type: 'emoji' },
  { id: 77, name: '💨 Dashing Away', emoji: '💨', type: 'emoji' },
  { id: 78, name: '💦 Sweat Droplets', emoji: '💦', type: 'emoji' },
  { id: 79, name: '👀 Eyes', emoji: '👀', type: 'emoji' },
  { id: 80, name: '👅 Tongue', emoji: '👅', type: 'emoji' },
  { id: 81, name: '👋 Waving Hand', emoji: '👋', type: 'emoji' },
  { id: 82, name: '🤝 Handshake', emoji: '🤝', type: 'emoji' },
  { id: 83, name: '✌️ Victory Hand', emoji: '✌️', type: 'emoji' },
  { id: 84, name: '🤞 Crossed Fingers', emoji: '🤞', type: 'emoji' },
  { id: 85, name: '🤟 Love-You Gesture', emoji: '🤟', type: 'emoji' },
  { id: 86, name: '👊 Oncoming Fist', emoji: '👊', type: 'emoji' },
  { id: 87, name: '🤲 Palms Up Together', emoji: '🤲', type: 'emoji' },
  { id: 88, name: '🙈 See-No-Evil Monkey', emoji: '🙈', type: 'emoji' },
  { id: 89, name: '🙉 Hear-No-Evil Monkey', emoji: '🙉', type: 'emoji' },
  { id: 90, name: '🙊 Speak-No-Evil Monkey', emoji: '🙊', type: 'emoji' },
  { id: 91, name: '💋 Kiss Mark', emoji: '💋', type: 'emoji' },
  { id: 92, name: '💌 Love Letter', emoji: '💌', type: 'emoji' },
  { id: 93, name: '💣 Bomb', emoji: '💣', type: 'emoji' },
  { id: 94, name: '🔫 Water Pistol', emoji: '🔫', type: 'emoji' },
  { id: 95, name: '🔪 Kitchen Knife', emoji: '🔪', type: 'emoji' },
  { id: 96, name: '🏠 House', emoji: '🏠', type: 'emoji' },
  { id: 97, name: '🏖️ Beach with Umbrella', emoji: '🏖️', type: 'emoji' },
  { id: 98, name: '🗽 Statue of Liberty', emoji: '🗽', type: 'emoji' },
  { id: 99, name: '🦄 Unicorn', emoji: '🦄', type: 'emoji' },
  { id: 100, name: '🐶 Dog Face', emoji: '🐶', type: 'emoji' }
];

const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Comic Sans MS'];

const filters = {
  none: 'none',
  vintage: 'sepia(0.5) contrast(1.2)',
  grayscale: 'grayscale(1)',
  invert: 'invert(1)',
  blur: 'blur(2px)',
  saturate: 'saturate(2)',
};

const formatDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return 'Invalid Date';
  }
};

const formatTime = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const drawHeart = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 3);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 3);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size);
  ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 3);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawThoughtBubble = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.moveTo(x + size * 0.8, y + size * 0.6);
  ctx.arc(x + size * 0.8, y + size * 0.6, size * 0.2, 0, 2 * Math.PI);
  ctx.moveTo(x + size * 1.1, y + size * 0.8);
  ctx.arc(x + size * 1.1, y + size * 0.8, size * 0.15, 0, 2 * Math.PI);
  ctx.moveTo(x + size * 1.3, y + size * 1.0);
  ctx.arc(x + size * 1.3, y + size * 1.0, size * 0.1, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

const drawSpeechBubble = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.moveTo(x + size * 0.7, y);
  ctx.lineTo(x + size * 1.2, y - size * 0.3);
  ctx.lineTo(x + size * 1.2, y + size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const resizeCanvasImage = (canvas, targetWidth = 200, targetHeight = 200) => {
  const resizeCanvas = document.createElement('canvas');
  resizeCanvas.width = targetWidth;
  resizeCanvas.height = targetHeight;
  const ctx = resizeCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  return resizeCanvas.toDataURL('image/png', 0.8);
};

const StickerDialog = forwardRef(({ open, setOpen, selectedUser, user, socket, setMessages }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [stickerImage, setStickerImage] = useState(null);
  const [originalStickerImage, setOriginalStickerImage] = useState(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [stickerLayers, setStickerLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasRotation, setCanvasRotation] = useState(0);
  const [canvasFlip, setCanvasFlip] = useState({ horizontal: false, vertical: false });
  const [currentFilter, setCurrentFilter] = useState('none');
  const [layerOpacity, setLayerOpacity] = useState(100);
  const [editingText, setEditingText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(32);
  const [mobileActiveTab, setMobileActiveTab] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
  const [showElements, setShowElements] = useState(false);

  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontFamily: 'Arial'
  });

  const stickerCanvasRef = useRef(null);
  const stickerInputRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);



  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      stickerInputRef.current?.click();
    }
  }));

  const updateStickerCanvas = useCallback(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseSize = 400;
    canvas.width = baseSize;
    canvas.height = baseSize;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvasFlip.horizontal ? -canvasScale : canvasScale, canvasFlip.vertical ? -canvasScale : canvasScale);
    ctx.rotate((canvasRotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.filter = filters[currentFilter] || 'none';

    if (stickerImage) {
      ctx.drawImage(stickerImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    stickerLayers.forEach(layer => {
      ctx.save();
      ctx.globalAlpha = (layer.opacity || layerOpacity) / 100;

      if (layer.type === 'text') {
        ctx.font = `${textStyles.bold ? 'bold ' : ''}${textStyles.italic ? 'italic ' : ''}${layer.size || textSize}px ${layer.fontFamily || textStyles.fontFamily}`;
        ctx.fillStyle = layer.color || textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (textStyles.underline) {
          ctx.strokeStyle = layer.color || textColor;
          ctx.lineWidth = 1;
        }

        const x = (layer.x || 50) / 100 * canvas.width;
        const y = (layer.y || 50) / 100 * canvas.height;

        ctx.fillText(layer.text || 'Text', x, y);

        if (textStyles.underline) {
          const textWidth = ctx.measureText(layer.text || 'Text').width;
          ctx.beginPath();
          ctx.moveTo(x - textWidth / 2, y + (layer.size || textSize) / 2);
          ctx.lineTo(x + textWidth / 2, y + (layer.size || textSize) / 2);
          ctx.stroke();
        }

        if (selectedLayerId === layer.id) {
          const textWidth = ctx.measureText(layer.text || 'Text').width;
          const textHeight = (layer.size || textSize);
          ctx.strokeStyle = '#007bff';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x - textWidth / 2 - 5,
            y - textHeight / 2 - 5,
            textWidth + 10,
            textHeight + 10
          );
        }
      } else if (layer.type === 'emoji') {
        ctx.font = `${layer.size || 40}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.emoji, layer.x / 100 * canvas.width, layer.y / 100 * canvas.height);
      } else if (layer.type === 'shape') {
        ctx.fillStyle = layer.fill || 'rgba(255,255,255,0.8)';
        ctx.strokeStyle = layer.stroke || '#000';
        ctx.lineWidth = layer.strokeWidth || 2;

        const x = layer.x / 100 * canvas.width;
        const y = layer.y / 100 * canvas.height;
        const size = layer.size || 50;

        switch (layer.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
          case 'square':
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
            ctx.strokeRect(x - size, y - size, size * 2, size * 2);
            break;
          case 'heart':
            drawHeart(ctx, x, y, size);
            break;
          case 'thought':
            drawThoughtBubble(ctx, x, y, size);
            break;
          case 'speech':
            drawSpeechBubble(ctx, x, y, size);
            break;
          default:
            break;
        }
      }
      ctx.restore();
    });

    ctx.restore();
  }, [stickerImage, stickerLayers, textSize, textColor, selectedLayerId, canvasScale, canvasRotation, canvasFlip, currentFilter, textStyles, layerOpacity]);

  const handleCropComplete = (croppedDataUrl) => {
    const img = new Image();
    img.onload = () => {
      setStickerImage(img);
      setShowCropDialog(false);
      setStickerLayers([]);
      setSelectedLayerId(null);
      setTimeout(updateStickerCanvas, 100);
    };
    img.onerror = (err) => {
      console.error('Failed to load cropped image:', err);
    };
    img.src = croppedDataUrl;
  };

  useEffect(() => {
    if (stickerImage) {
      updateStickerCanvas();
    }
  }, [stickerImage, updateStickerCanvas]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        updateStickerCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, showCropDialog, stickerImage, stickerLayers, updateStickerCanvas]);

  const addTextLayer = (text = '') => {
    const layer = {
      id: `text_${generateUniqueId()}`,
      type: 'text',
      text: text || '',
      x: 50,
      y: 50,
      size: textSize,
      color: textColor,
      fontFamily: textStyles.fontFamily,
      opacity: layerOpacity
    };
    setStickerLayers(prev => [...prev, layer]);
    setSelectedLayerId(layer.id);
    updateStickerCanvas();
  };

  const addEmojiLayer = (emoji) => {
    const layer = {
      id: `emoji_${generateUniqueId()}`,
      type: 'emoji',
      emoji: emoji,
      x: 30,
      y: 30,
      size: 40
    };
    setStickerLayers(prev => [...prev, layer]);
    setSelectedLayerId(layer.id);
    updateStickerCanvas();
  };

  // eslint-disable-next-line no-unused-vars
  const addShapeLayer = (shape) => {
    const layer = {
      id: `shape_${generateUniqueId()}`,
      type: 'shape',
      shape: shape,
      x: 50,
      y: 50,
      size: 30,
      fill: 'rgba(255,255,255,0.8)',
      stroke: '#000',
      strokeWidth: 2
    };
    setStickerLayers(prev => [...prev, layer]);
    setSelectedLayerId(layer.id);
    setTimeout(updateStickerCanvas);
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = stickerCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (let i = stickerLayers.length - 1; i >= 0; i--) {
      const layer = stickerLayers[i];
      const layerX = layer.x;
      const layerY = layer.y;

      const distance = Math.sqrt(Math.pow(x - layerX, 2) + Math.pow(y - layerY, 2));
      if (distance < 10) {
        setSelectedLayerId(layer.id);
        selectedLayerRef.current = layer;
        isDraggingRef.current = true;
        dragStartRef.current = { x, y, layerX: layer.x, layerY: layer.y };
        return;
      }
    }

    setSelectedLayerId(null);
    selectedLayerRef.current = null;
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = stickerCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDraggingRef.current && selectedLayerRef.current) {
      const deltaX = x - dragStartRef.current.x;
      const deltaY = y - dragStartRef.current.y;

      setStickerLayers(prev => prev.map(layer =>
        layer.id === selectedLayerRef.current.id
          ? { ...layer, x: dragStartRef.current.layerX + deltaX, y: dragStartRef.current.layerY + deltaY }
          : layer
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
    selectedLayerRef.current = null;
    setTimeout(updateStickerCanvas, 0);
  };

  const handleCanvasTouchStart = (e) => {
    handleCanvasMouseDown(e.touches[0]);
  };

  const handleCanvasTouchMove = (e) => {
    handleCanvasMouseMove(e.touches[0]);
  };

  const handleCanvasTouchEnd = () => {
    handleCanvasMouseUp();
  };

  const handleSendSticker = () => {
    if (!stickerImage || !stickerCanvasRef.current || !selectedUser || !socket || !user) return;

    try {
      const resizedDataUrl = resizeCanvasImage(stickerCanvasRef.current, 200, 200);
      const msgId = generateUniqueId();

      const newMessage = {
        id: msgId,
        senderId: user._id,
        senderUsername: user.username,
        receiverId: selectedUser._id,
        receiverUsername: selectedUser.username,
        roomId: [user._id, selectedUser._id].sort().join('-'),
        image: resizedDataUrl,
        type: 'sticker',
        timestamp: Date.now()
      };

      socket.emit('send_message', newMessage);

      setMessages(prev => {
        const updated = { ...prev };
        if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
        updated[selectedUser._id].push({
          id: msgId,
          sender: 'You',
          image: resizedDataUrl,
          type: 'sticker',
          timestamp: formatTime(new Date()),
          date: formatDate(new Date()),
        });
        return updated;
      });

      handleCancelSticker();
    } catch (err) {
      console.error('Failed to send sticker:', err);
    }
  };

  const handleCancelSticker = () => {
    setOpen(false);
    setShowCropDialog(false);
    setStickerImage(null);
    setOriginalStickerImage(null);
    setStickerLayers([]);
    setSelectedLayerId(null);
    setCanvasScale(1);
    setCanvasRotation(0);
    setCanvasFlip({ horizontal: false, vertical: false });
    setCurrentFilter('none');
    setLayerOpacity(100);

    if (stickerInputRef.current) {
      stickerInputRef.current.value = '';
    }
  };

  const handleStickerImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          setStickerImage(img);
          setOriginalStickerImage(imageUrl);
          setOpen(true);
          setShowCropDialog(true);
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseUp);

    canvas.addEventListener('touchstart', handleCanvasTouchStart);
    canvas.addEventListener('touchmove', handleCanvasTouchMove);
    canvas.addEventListener('touchend', handleCanvasTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseup', handleCanvasMouseUp);
      canvas.removeEventListener('mouseleave', handleCanvasMouseUp);

      canvas.removeEventListener('touchstart', handleCanvasTouchStart);
      canvas.removeEventListener('touchmove', handleCanvasTouchMove);
      canvas.removeEventListener('touchend', handleCanvasTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickerLayers, selectedLayerId]);

  useEffect(() => {
    updateStickerCanvas();
  }, [updateStickerCanvas]);



  return (
    <>
      <Dialog
        open={open}
        onClose={handleCancelSticker}
        fullWidth
        maxWidth={isMobile ? "sm" : "lg"}
        TransitionComponent={isMobile ? Slide : undefined}
        TransitionProps={isMobile ? { direction: "up" } : undefined}
        PaperProps={{
          sx: isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            borderRadius: '20px 20px 0 0',
            width: '100%',
            height: { xs: '85vh', sm: '80vh', md: '75vh' },
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 'env(safe-area-inset-bottom)'
          } : {
            borderRadius: '24px',
            width: '960px',
            maxWidth: '95vw',
            height: '85vh',
            maxHeight: '900px',
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.35)' } }}
      >
        <Box sx={{
          px: 3,
          pt: isMobile ? 1 : 2.5,
          pb: isMobile ? 1.5 : 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(90deg, var(--primary-color, #ff7aa3), var(--primary-color, #ff4d86))',
          color: '#fff',
          zIndex: 1300,
          flexShrink: 0
        }}>
          {/* Top pull indicator pill bar */}
          {isMobile && (
            <Box sx={{
              width: 42,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.6)',
              mb: 1
            }} />
          )}
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
              <Box sx={{
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <AutoAwesomeIcon sx={{ fontSize: isMobile ? 16 : 20, color: 'white' }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  fontSize: { md: '1.25rem', xs: '14px' }
                }}
              >
                Create Sticker
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: isMobile ? 1 : 1.5, alignItems: 'center' }}>
              <Button
                key="cancel-sticker-btn"
                onClick={handleCancelSticker}
                size={isMobile ? "small" : "medium"}
                color="inherit"
                startIcon={isMobile ? null : <CloseIcon />}
                sx={{
                  borderRadius: 2.5,
                  px: isMobile ? 1.5 : 3,
                  py: isMobile ? 0.75 : 1,
                  minWidth: isMobile ? '40px' : 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {isMobile ? <CloseIcon fontSize="small" /> : "Cancel"}
              </Button>
              <Button
                key="send-sticker-btn"
                variant="contained"
                onClick={handleSendSticker}
                disabled={!stickerImage}
                size={isMobile ? "small" : "medium"}
                startIcon={isMobile ? null : <SendIcon />}
                sx={{
                  borderRadius: 2.5,
                  px: isMobile ? 1.5 : 3,
                  py: isMobile ? 0.75 : 1,
                  minWidth: isMobile ? '40px' : 'auto',
                  bgcolor: '#fff',
                  color: 'var(--primary-color, #ff4d86)',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                    color: 'rgba(255, 77, 134, 0.5)',
                    cursor: 'not-allowed'
                  },
                  '&:hover': {
                    bgcolor: '#fff',
                    opacity: 0.95,
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isMobile ? <SendIcon fontSize="small" /> : "Send"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}>
          <Box sx={{
            p: isMobile ? 2 : 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            flexShrink: 0,
            width: isMobile ? '100%' : '450px',
            height: isMobile ? 'auto' : '100%',
            minHeight: isMobile ? 260 : 'auto'
          }}>
            <Box sx={{
              position: 'relative',
              width: { xs: 240, sm: 300, md: 350 },
              height: { xs: 240, sm: 300, md: 350 },
              background: 'white',
              borderRadius: 3,
              overflow: 'hidden',
              border: '3px solid rgba(255, 255, 255, 0.9)',
              boxShadow: `
                0 20px 40px rgba(0,0,0,0.1),
                0 0 0 1px rgba(255, 255, 255, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
              `,
              touchAction: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <canvas
                ref={stickerCanvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
              />
            </Box>

            {!stickerImage && (
              <Box sx={{
                textAlign: 'center',
                mt: { xs: 1.5, md: 3 },
                p: { xs: 2, md: 4 },
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                borderRadius: 3,
                border: '2px dashed rgba(102, 126, 234, 0.3)',
                maxWidth: { xs: 280, sm: 400 },
                width: '100%',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{
                  width: { xs: 50, md: 80 },
                  height: { xs: 50, md: 80 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: { xs: 1, md: 2 },
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                }}>
                  <CloudUploadIcon sx={{ fontSize: { xs: 24, md: 32 }, color: 'white' }} />
                </Box>
                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                  No Image Selected
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: { xs: 1.5, md: 3 } }}>
                  Choose an image to start creating your sticker
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => stickerInputRef.current?.click()}
                  size={isMobile ? "small" : "large"}
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderRadius: 2.5,
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 1, md: 1.5 },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Upload Image
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderTop: { xs: '1px solid rgba(0, 0, 0, 0.08)', md: 'none' },
            borderLeft: { xs: 'none', md: '1px solid rgba(0, 0, 0, 0.08)' },
            background: 'white'
          }}>
            <Box sx={{
              borderBottom: 1,
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              flexShrink: 0
            }}>
              <Tabs
                value={mobileActiveTab}
                onChange={(e, newValue) => setMobileActiveTab(newValue)}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons={isMobile ? "auto" : undefined}
                allowScrollButtonsMobile={isMobile ? true : undefined}
                sx={{
                  '& .MuiTabs-indicator': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    height: 3,
                    borderRadius: 2
                  },
                  '& .MuiTab-root': {
                    minHeight: 52,
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: 'text.secondary',
                    px: isMobile ? 1.5 : 2,
                    '&.Mui-selected': {
                      color: '#667eea',
                    },
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <Tab
                  icon={<TuneIcon />}
                  label="TOOLS"
                  iconPosition="start"
                  sx={{ minWidth: 0 }}
                />
                <Tab
                  icon={<TextFieldsIcon />}
                  label="TEXT"
                  iconPosition="start"
                  sx={{ minWidth: 0 }}
                />
                <Tab
                  icon={<LayersIcon />}
                  label={`LAYERS (${stickerLayers.length})`}
                  iconPosition="start"
                  sx={{ minWidth: 0 }}
                />
                <Tab
                  icon={<CropIcon fontSize="small" />}
                  label="CROP"
                  iconPosition="start"
                  sx={{ minWidth: 0 }}
                />
              </Tabs>
            </Box>

            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              {mobileActiveTab === 0 && (
                <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TuneIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Quick Actions
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[
                        { icon: <NearMeIcon />, label: 'Select', value: 'select' },
                        { icon: <TextFieldsIcon />, label: 'Add Text', value: 'text' },
                        { icon: <AutoAwesomeIcon />, label: 'Elements', value: 'elements' },
                        { icon: <CropIcon fontSize="small" />, label: 'Crop', value: 'crop' },
                      ].map((tool) => (
                        <Button
                          key={tool.value}
                          variant={activeTool === tool.value || (tool.value === 'elements' && showElements) ? "contained" : "outlined"}
                          onClick={() => {
                            if (tool.value === 'text') addTextLayer();
                            else if (tool.value === 'elements') setShowElements(!showElements);
                            else if (tool.value === 'crop') setShowCropDialog(true);
                            else setActiveTool(tool.value);
                          }}
                          size="small"
                          startIcon={tool.icon}
                          sx={{
                            borderRadius: 2.5,
                            px: 2,
                            flex: 1,
                            minWidth: '120px',
                            background: activeTool === tool.value || (tool.value === 'elements' && showElements)
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {tool.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TransformIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Transform
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2.5, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 2.5, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Rotation
                        </Typography>
                        <Chip
                          label={`${canvasRotation}°`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, background: 'rgba(102, 126, 234, 0.1)' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <IconButton
                          key="rotate-left-btn"
                          size="small"
                          onClick={() => setCanvasRotation(prev => prev - 90)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: 2,
                            flex: 1,
                            py: 1,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }
                          }}
                        >
                          <RotateLeftIcon />
                        </IconButton>
                        <IconButton
                          key="rotate-right-btn"
                          size="small"
                          onClick={() => setCanvasRotation(prev => prev + 90)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: 2,
                            flex: 1,
                            py: 1,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }
                          }}
                        >
                          <RotateRightIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2.5, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 2.5, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Scale
                        </Typography>
                        <Chip
                          label={`${Math.round(canvasScale * 100)}%`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, background: 'rgba(102, 126, 234, 0.1)' }}
                        />
                      </Box>
                      <Slider
                        value={canvasScale}
                        onChange={(e, val) => setCanvasScale(val)}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        size="small"
                        sx={{ color: '#667eea' }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {mobileActiveTab === 1 && (
                <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TextFieldsIcon sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Text Editor
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Text Content"
                    value={editingText}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setEditingText(newText);
                      setStickerLayers(prev =>
                        prev.map(l =>
                          l.id === selectedLayerId ? { ...l, text: newText } : l
                        )
                      );
                      updateStickerCanvas();
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiInputLabel-root': {
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(4px)',
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.10))',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)',
                        backdropFilter: 'blur(12px)',
                        transition: 'all 0.22s ease',
                        '& fieldset': {
                          borderColor: 'rgba(148, 163, 184, 0.5)',
                        },
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 10px 26px rgba(37, 99, 235, 0.35)',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.38), rgba(255,255,255,0.18))',
                          '& fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.9)',
                          },
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.8)',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.22))',
                          '& fieldset': {
                            borderWidth: '1px',
                            borderColor: 'rgba(129, 140, 248, 1)',
                          },
                        },
                        '& input': {
                          color: '#0f172a',
                        },
                      },
                    }}
                    inputProps={{
                      style: { fontSize: '14px', fontWeight: 500 },
                    }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 2, display: 'block', color: 'text.primary' }}>
                      Text Style
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        mb: 2,
                        justifyContent: 'center',
                      }}
                    >
                      {[
                        { icon: <FormatBoldIcon fontSize="small" />, label: 'Bold', style: 'bold' },
                        { icon: <FormatItalicIcon fontSize="small" />, label: 'Italic', style: 'italic' },
                        { icon: <FormatUnderlinedIcon fontSize="small" />, label: 'Underline', style: 'underline' },
                      ].map((format) => {
                        const isActive = !!textStyles[format.style];

                        return (
                          <Button
                            key={format.style}
                            onClick={() => {
                              const newValue = !textStyles[format.style];
                              setTextStyles((prev) => ({ ...prev, [format.style]: newValue }));
                              setStickerLayers((prev) =>
                                prev.map((l) =>
                                  l.id === selectedLayerId ? { ...l, [format.style]: newValue } : l
                                )
                              );
                              updateStickerCanvas();
                            }}
                            variant="text"
                            sx={{
                              minWidth: 0,
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              p: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isActive
                                ? 'linear-gradient(135deg, rgba(102,126,234,0.35), rgba(118,75,162,0.5))'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              boxShadow: isActive
                                ? '0 8px 20px rgba(118, 75, 162, 0.45)'
                                : '0 4px 12px rgba(15, 23, 42, 0.18)',
                              backdropFilter: 'blur(10px)',
                              color: isActive ? '#ffffff' : '#1f2933',
                              transition: 'all 0.22s ease',
                              '&:hover': {
                                transform: 'translateY(-2px) scale(1.06)',
                                boxShadow: '0 10px 24px rgba(88, 28, 135, 0.55)',
                                background: isActive
                                  ? 'linear-gradient(135deg, rgba(102,126,234,0.6), rgba(118,75,162,0.8))'
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12))',
                              },
                              '& .MuiButton-startIcon': {
                                m: 0,
                              },
                            }}
                          >
                            {format.icon}
                          </Button>
                        );
                      })}
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: 'stretch',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.4,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0.10))',
                          border: '1px solid rgba(255,255,255,0.55)',
                          boxShadow: '0 8px 22px rgba(15,23,42,0.20)',
                          backdropFilter: 'blur(14px)',
                          transition: 'all 0.22s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 10px 26px rgba(37, 99, 235, 0.32)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.16))',
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            mb: 1.2,
                            display: 'block',
                            color: 'rgba(15,23,42,0.85)',
                            fontSize: '11px',
                          }}
                        >
                          Size: {textSize}px
                        </Typography>
                        <Slider
                          value={textSize}
                          onChange={(e, newValue) => {
                            setTextSize(newValue);
                            setStickerLayers(prev =>
                              prev.map(l =>
                                l.id === selectedLayerId ? { ...l, size: newValue } : l
                              )
                            );
                            updateStickerCanvas();
                          }}
                          min={12}
                          max={72}
                          size="small"
                          sx={{
                            width: '100%',
                            color: '#667eea',
                            '& .MuiSlider-track': {
                              border: 'none',
                            },
                            '& .MuiSlider-rail': {
                              opacity: 0.3,
                            },
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                              background: 'linear-gradient(135deg, rgba(102,126,234,1), rgba(118,75,162,1))',
                              boxShadow: '0 3px 10px rgba(102, 126, 234, 0.55)',
                              border: '2px solid rgba(255,255,255,0.8)',
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          p: 1.4,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0.10))',
                          border: '1px solid rgba(255,255,255,0.55)',
                          boxShadow: '0 8px 22px rgba(15,23,42,0.20)',
                          backdropFilter: 'blur(14px)',
                          transition: 'all 0.22s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 10px 26px rgba(37, 99, 235, 0.32)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.16))',
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            mb: 1.2,
                            display: 'block',
                            color: 'rgba(15,23,42,0.85)',
                            fontSize: '11px',
                          }}
                        >
                          Color
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Box
                            sx={{
                              position: 'relative',
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              overflow: 'hidden',
                              border: '1px solid rgba(255,255,255,0.7)',
                              boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.20))',
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            <input
                              type="color"
                              value={textColor}
                              onChange={e => {
                                const newColor = e.target.value;
                                setTextColor(newColor);
                                setStickerLayers(prev =>
                                  prev.map(l =>
                                    l.id === selectedLayerId ? { ...l, color: newColor } : l
                                  )
                                );
                                updateStickerCanvas();
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: 0,
                                cursor: 'pointer',
                                background: 'transparent',
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: '12px',
                              letterSpacing: 0.4,
                              color: 'rgba(15,23,42,0.9)',
                            }}
                          >
                            {textColor.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 1,
                        p: 1.4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0.10))',
                        border: '1px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 8px 22px rgba(15,23,42,0.20)',
                        backdropFilter: 'blur(14px)',
                        transition: 'all 0.22s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 10px 26px rgba(37, 99, 235, 0.32)',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.16))',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          mb: 1.2,
                          display: 'block',
                          color: 'rgba(15,23,42,0.85)',
                          fontSize: '11px',
                        }}
                      >
                        Font Family
                      </Typography>

                      <Box
                        sx={{
                          position: 'relative',
                          '&::after': {
                            content: '"▼"',
                            position: 'absolute',
                            right: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#667eea',
                            fontSize: '11px',
                            pointerEvents: 'none',
                            opacity: 0.9,
                          },
                        }}
                      >
                        <select
                          value={textStyles.fontFamily}
                          onChange={e => {
                            const newFont = e.target.value;
                            setTextStyles(prev => ({ ...prev, fontFamily: newFont }));
                            setStickerLayers(prev =>
                              prev.map(l =>
                                l.id === selectedLayerId ? { ...l, fontFamily: newFont } : l
                              )
                            );
                            updateStickerCanvas();
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 40px 10px 14px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.7)',
                            fontSize: '14px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.26))',
                            fontWeight: 600,
                            color: '#0f172a',
                            appearance: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 5px 16px rgba(15,23,42,0.25)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          {fonts.map(font => (
                            <option
                              key={font}
                              value={font}
                              style={{
                                fontWeight: 500,
                              }}
                            >
                              {font}
                            </option>
                          ))}
                        </select>
                      </Box>
                    </Box>
                  </Box>

                  {!selectedLayerId && (
                    <Box sx={{
                      textAlign: 'center',
                      py: 4,
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 2.5,
                      border: '2px dashed rgba(102, 126, 234, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <TextFieldsIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        No text layer selected
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Select a text layer or add new text to edit
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {mobileActiveTab === 2 && (
                <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <LayersIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Layers
                      </Typography>
                    </Box>
                    <Chip
                      label={stickerLayers.length}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 700
                      }}
                    />
                  </Box>

                  <Box sx={{
                    maxHeight: isMobile ? 250 : 400,
                    overflowY: 'auto',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 2.5,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {stickerLayers.map((layer, index) => (
                      <Box
                        key={layer.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          background: selectedLayerId === layer.id
                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                            : 'white',
                          border: '2px solid',
                          borderColor: selectedLayerId === layer.id ? '#667eea' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: selectedLayerId === layer.id
                            ? '0 4px 20px rgba(102, 126, 234, 0.2)'
                            : '0 2px 8px rgba(0,0,0,0.05)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                          }
                        }}
                        onClick={() => setSelectedLayerId(layer.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selectedLayerId === layer.id
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'rgba(0, 0, 0, 0.05)',
                            color: selectedLayerId === layer.id ? 'white' : 'grey.700',
                            boxShadow: selectedLayerId === layer.id ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
                          }}>
                            {layer.type === 'text' && <TextFieldsIcon fontSize="small" />}
                            {layer.type === 'emoji' && <EmojiEmotionsIcon fontSize="small" />}
                            {layer.type === 'shape' && <CropSquareIcon fontSize="small" />}
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              color: selectedLayerId === layer.id ? '#667eea' : 'text.primary'
                            }}>
                              {layer.type === 'text' ? `"${layer.text}"` :
                                layer.type === 'emoji' ? `Emoji: ${layer.emoji}` :
                                  `Shape: ${layer.shape}`}
                            </Typography>
                            <Typography variant="caption" sx={{
                              fontSize: '0.7rem',
                              color: selectedLayerId === layer.id ? '#667eea' : 'text.secondary',
                              fontWeight: 500
                            }}>
                              {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)} Layer
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStickerLayers(prev => prev.filter(l => l.id !== layer.id));
                            if (selectedLayerId === layer.id) {
                              setSelectedLayerId(null);
                            }
                            updateStickerCanvas();
                          }}
                          sx={{
                            color: 'error.main',
                            background: 'rgba(244, 67, 54, 0.1)',
                            '&:hover': {
                              background: 'error.main',
                              color: 'white',
                              transform: 'scale(1.1)'
                            },
                            ml: 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>

                  {stickerLayers.length === 0 && (
                    <Box sx={{
                      textAlign: 'center',
                      py: 4,
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 2.5,
                      border: '2px dashed rgba(102, 126, 234, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <LayersIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        No layers added yet
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Add text or elements to see them here
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {mobileActiveTab === 3 && (
                <Box sx={{ p: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary" align="center">
                    Want to crop or rotate the original image again?
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CropIcon />}
                    onClick={() => setShowCropDialog(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 4,
                      py: 1.2
                    }}
                  >
                    Open Crop Editor
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {showElements && (
          <Box sx={{
            p: isMobile ? 1.5 : 2.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            maxHeight: { xs: 130, md: 200 },
            overflowY: 'auto',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
            flexShrink: 0
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AutoAwesomeIcon sx={{ fontSize: 12, color: 'white' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Elements
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowElements(false)}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  background: 'white',
                  '&:hover': {
                    background: 'grey.50',
                    transform: 'rotate(90deg)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {stickerElements.map(element => (
                <Button
                  key={element.id}
                  variant="outlined"
                  size="small"
                  onClick={() => addEmojiLayer(element.emoji)}
                  sx={{
                    borderRadius: 2.5,
                    fontSize: { xs: '1.1rem', md: '1.4rem' },
                    minWidth: 'auto',
                    px: { xs: 1.5, md: 2.5 },
                    py: { xs: 1, md: 1.5 },
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      background: 'white',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {element.emoji}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        <input
          type="file"
          ref={stickerInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleStickerImageSelect}
        />
      </Dialog>

      <Crop
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        imageSrc={originalStickerImage}
        onCropComplete={handleCropComplete}
      />
    </>
  );
});

export default StickerDialog;
