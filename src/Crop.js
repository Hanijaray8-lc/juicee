import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  Box, 
  Button, 
  Slider, 
  Typography,
  IconButton,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { 
  Crop as CropIcon,
  Close as CloseIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';

const Crop = ({ open, onClose, imageSrc, onCropComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 400, height: 400 });
  const [isHoveringCrop, setIsHoveringCrop] = useState(false);
  const [hoveredControl, setHoveredControl] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    }
  }, [open]);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        
        const cropSize = Math.min(img.width, img.height) * 0.8;
        setCropArea({
          x: (img.width - cropSize) / 2,
          y: (img.height - cropSize) / 2,
          width: cropSize,
          height: cropSize
        });
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    const isInsideCrop = 
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height;
    
    if (isInsideCrop) {
      setIsDragging(true);
      setDragStart({ 
        x: x - cropArea.x, 
        y: y - cropArea.y 
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    const constrainedX = Math.max(0, Math.min(newX, imageDimensions.width - cropArea.width));
    const constrainedY = Math.max(0, Math.min(newY, imageDimensions.height - cropArea.height));
    
    setCropArea(prev => ({
      ...prev,
      x: constrainedX,
      y: constrainedY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResize = (axis, value) => {
    setCropArea(prev => {
      const newValue = { ...prev };
      
      if (axis === 'width') {
        newValue.width = Math.max(50, Math.min(value, imageDimensions.width - newValue.x));
      } else if (axis === 'height') {
        newValue.height = Math.max(50, Math.min(value, imageDimensions.height - newValue.y));
      }
      
      return newValue;
    });
  };

  const handleCrop = () => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
      );
      
      const croppedDataUrl = canvas.toDataURL('image/png');
      onCropComplete(croppedDataUrl);
      onClose();
    };
    
    img.src = imageSrc;
  };

  // Mobile-friendly touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    const isInsideCrop = 
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height;
    
    if (isInsideCrop) {
      setIsDragging(true);
      setDragStart({ 
        x: x - cropArea.x, 
        y: y - cropArea.y 
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    const constrainedX = Math.max(0, Math.min(newX, imageDimensions.width - cropArea.width));
    const constrainedY = Math.max(0, Math.min(newY, imageDimensions.height - cropArea.height));
    
    setCropArea(prev => ({
      ...prev,
      x: constrainedX,
      y: constrainedY
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile} // Mobile la full screen
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          maxHeight: isMobile ? '100dvh' : '90vh',
          height: isMobile ? '100dvh' : 'auto',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{ 
        p: isMobile ? 2 : 3,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: isMobile ? 2 : 3,
          flexShrink: 0
        }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Edit & Crop Image
          </Typography>
          <IconButton 
            onClick={onClose}
            size={isMobile ? "small" : "medium"}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 64, 129, 0.1)',
                transform: 'rotate(90deg)',
                borderColor: '#ff4081'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
          </IconButton>
        </Box>

        {/* Main Content - Scrollable in Mobile */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: isMobile ? 2 : 3,
          overflow: 'hidden'
        }}>
          {/* Image Preview Section - Fixed Height */}
          <Box sx={{ 
            flex: isMobile ? '0 0 auto' : 1,
            minHeight: isMobile ? '40vh' : 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseEnter={() => setIsHoveringCrop(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              sx={{
                position: 'relative',
                width: '100%',
                height: isMobile ? 300 : 400,
                bgcolor: '#ffffff',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                '&:hover': {
                  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.08)',
                  borderColor: 'rgba(255, 64, 129, 0.2)'
                }
              }}
            >
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
              )}
              
              {/* Crop Area Overlay */}
              {imageDimensions.width > 0 && (
                <Box
                  onMouseEnter={() => setIsHoveringCrop(true)}
                  onMouseLeave={() => setIsHoveringCrop(false)}
                  sx={{
                    position: 'absolute',
                    left: `${(cropArea.x / imageDimensions.width) * 100}%`,
                    top: `${(cropArea.y / imageDimensions.height) * 100}%`,
                    width: `${(cropArea.width / imageDimensions.width) * 100}%`,
                    height: `${(cropArea.height / imageDimensions.height) * 100}%`,
                    border: `2px solid ${isHoveringCrop ? '#00c9ff' : '#ff4081'}`,
                    background: isHoveringCrop 
                      ? 'linear-gradient(135deg, rgba(0, 201, 255, 0.08) 0%, rgba(255, 64, 129, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 64, 129, 0.05) 0%, rgba(100, 126, 234, 0.05) 100%)',
                    cursor: 'move',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(2px)',
                    '&:hover': {
                      borderColor: '#00c9ff',
                      boxShadow: '0 0 0 1px rgba(0, 201, 255, 0.3) inset'
                    }
                  }}
                >
                  {/* Crop handles */}
                  <Box sx={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 16,
                    height: 16,
                    bgcolor: 'white',
                    borderRadius: '50%',
                    border: '2px solid #ff4081',
                    cursor: 'nwse-resize',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      transform: 'scale(1.2)',
                      borderColor: '#00c9ff',
                      boxShadow: '0 4px 12px rgba(0, 201, 255, 0.4)'
                    }
                  }} />
                </Box>
              )}
            </Box>

            {/* Control Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1, 
              mt: isMobile ? 1.5 : 2,
              p: isMobile ? 1 : 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              flexShrink: 0
            }}>
              {[
                { icon: <ZoomOutIcon />, action: () => setScale(prev => Math.max(0.5, prev - 0.1)), label: 'Zoom Out' },
                { icon: <RotateLeftIcon />, action: () => setRotation(prev => prev - 90), label: 'Rotate Left' },
                { icon: <RotateRightIcon />, action: () => setRotation(prev => prev + 90), label: 'Rotate Right' },
                { icon: <ZoomInIcon />, action: () => setScale(prev => Math.min(3, prev + 0.1)), label: 'Zoom In' }
              ].map((btn, index) => (
                <IconButton 
                  key={index}
                  onClick={btn.action}
                  size={isMobile ? "small" : "medium"}
                  onMouseEnter={() => setHoveredControl(index)}
                  onMouseLeave={() => setHoveredControl(null)}
                  sx={{
                    bgcolor: hoveredControl === index 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    color: hoveredControl === index ? 'white' : 'inherit',
                    border: '1px solid',
                    borderColor: hoveredControl === index 
                      ? 'transparent' 
                      : 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.25)',
                      bgcolor: hoveredControl === index 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : 'rgba(255, 64, 129, 0.05)'
                    },
                    '&:active': {
                      transform: 'translateY(0)'
                    }
                  }}
                  title={btn.label}
                >
                  {btn.icon}
                </IconButton>
              ))}
            </Box>
          </Box>

          {/* Controls Panel - Scrollable in Mobile */}
          <Box sx={{ 
            flex: 1,
            minWidth: { md: 300 },
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 1.5 : 2,
            overflow: isMobile ? 'auto' : 'visible',
            maxHeight: isMobile ? 'calc(100dvh - 400px)' : 'none',
            pr: isMobile ? 0.5 : 0,
            pb: isMobile ? 2 : 0
          }}>
            {/* Crop Position Control */}
            <Box sx={{
              p: isMobile ? 2 : 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              flexShrink: 0
            }}>
              <Typography variant="subtitle2" sx={{ 
                mb: isMobile ? 1.5 : 2, 
                fontWeight: 600,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{
                  width: 4,
                  height: 16,
                  bgcolor: '#667eea',
                  borderRadius: 2
                }} />
                Crop Position
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1.5 : 2, 
                mb: isMobile ? 0 : 2 
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    color: '#666',
                    display: 'block',
                    mb: 0.5
                  }}>
                    X: {Math.round(cropArea.x)}
                  </Typography>
                  <Slider
                    value={cropArea.x}
                    onChange={(e, v) => setCropArea(prev => ({ 
                      ...prev, 
                      x: Math.max(0, Math.min(v, imageDimensions.width - cropArea.width))
                    }))}
                    min={0}
                    max={imageDimensions.width - cropArea.width}
                    step={1}
                    size="small"
                    sx={{
                      color: '#667eea',
                      '& .MuiSlider-thumb': {
                        width: isMobile ? 14 : 16,
                        height: isMobile ? 14 : 16,
                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.4)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)'
                        }
                      },
                      '& .MuiSlider-track': {
                        height: 4,
                        borderRadius: 2
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                        borderRadius: 2,
                        opacity: 0.3
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    color: '#666',
                    display: 'block',
                    mb: 0.5
                  }}>
                    Y: {Math.round(cropArea.y)}
                  </Typography>
                  <Slider
                    value={cropArea.y}
                    onChange={(e, v) => setCropArea(prev => ({ 
                      ...prev, 
                      y: Math.max(0, Math.min(v, imageDimensions.height - cropArea.height))
                    }))}
                    min={0}
                    max={imageDimensions.height - cropArea.height}
                    step={1}
                    size="small"
                    sx={{
                      color: '#764ba2',
                      '& .MuiSlider-thumb': {
                        width: isMobile ? 14 : 16,
                        height: isMobile ? 14 : 16,
                        boxShadow: '0 2px 6px rgba(118, 75, 162, 0.4)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(118, 75, 162, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Crop Size Control */}
            <Box sx={{
              p: isMobile ? 2 : 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              flexShrink: 0
            }}>
              <Typography variant="subtitle2" sx={{ 
                mb: isMobile ? 1.5 : 2, 
                fontWeight: 600,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{
                  width: 4,
                  height: 16,
                  bgcolor: '#ff4081',
                  borderRadius: 2
                }} />
                Crop Size
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1.5 : 2 
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    color: '#666',
                    display: 'block',
                    mb: 0.5
                  }}>
                    Width: {Math.round(cropArea.width)}px
                  </Typography>
                  <Slider
                    value={cropArea.width}
                    onChange={(e, v) => handleResize('width', v)}
                    min={50}
                    max={imageDimensions.width}
                    step={1}
                    size="small"
                    sx={{
                      color: '#ff4081',
                      '& .MuiSlider-thumb': {
                        width: isMobile ? 14 : 16,
                        height: isMobile ? 14 : 16,
                        boxShadow: '0 2px 6px rgba(255, 64, 129, 0.4)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(255, 64, 129, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    color: '#666',
                    display: 'block',
                    mb: 0.5
                  }}>
                    Height: {Math.round(cropArea.height)}px
                  </Typography>
                  <Slider
                    value={cropArea.height}
                    onChange={(e, v) => handleResize('height', v)}
                    min={50}
                    max={imageDimensions.height}
                    step={1}
                    size="small"
                    sx={{
                      color: '#00c9ff',
                      '& .MuiSlider-thumb': {
                        width: isMobile ? 14 : 16,
                        height: isMobile ? 14 : 16,
                        boxShadow: '0 2px 6px rgba(0, 201, 255, 0.4)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(0, 201, 255, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Apply Button - Fixed at bottom in mobile */}
            <Box sx={{ 
              mt: 'auto', 
              pt: isMobile ? 1.5 : 2,
              px: isMobile ? 0.5 : 1,
              flexShrink: 0,
              position: isMobile ? 'sticky' : 'static',
              bottom: isMobile ? 0 : 'auto',
              bgcolor: isMobile ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
              backdropFilter: isMobile ? 'blur(10px)' : 'none',
              zIndex: isMobile ? 1000 : 'auto'
            }}>
              <Button
                onClick={handleCrop}
                variant="contained"
                startIcon={<CropIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
                fullWidth
                size={isMobile ? "medium" : "large"}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff4081 100%)',
                  backgroundSize: '200% auto',
                  border: 'none',
                  borderRadius: 2,
                  py: isMobile ? 1.5 : 1.8,
                  fontWeight: 600,
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  letterSpacing: '0.5px',
                  textTransform: 'none',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    backgroundPosition: 'right center',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                    '& .MuiButton-startIcon': {
                      transform: 'scale(1.2) rotate(5deg)'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  },
                  '& .MuiButton-startIcon': {
                    transition: 'transform 0.3s ease'
                  }
                }}
              >
                Apply Crop
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>
    </Dialog>
  );
};

export default Crop;