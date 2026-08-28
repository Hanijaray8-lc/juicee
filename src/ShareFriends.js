import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Button,
  Typography,
  Box
} from '@mui/material';

const ShareFriendsDialog = ({
  open,
  onClose,
  dbFriends = [],
  selectedShareFriends = [],
  setSelectedShareFriends,
  onConfirmShare,
  getProfileSrc
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'var(--primary-color, #128C7E)', color: 'white', py: 2 }}>
        <Typography variant="h6" fontWeight={700}>Send to...</Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0, minHeight: 300, maxHeight: 400 }}>
        <List>
          {dbFriends.map((friend) => {
            const isSelected = selectedShareFriends.some(f => f._id === friend._id);
            return (
              <ListItem key={friend._id} disablePadding>
                <ListItemButton onClick={() => {
                  if (isSelected) {
                    setSelectedShareFriends(prev => prev.filter(f => f._id !== friend._id));
                  } else {
                    setSelectedShareFriends(prev => [...prev, friend]);
                  }
                }}>
                  <ListItemAvatar>
                    <Avatar src={getProfileSrc ? getProfileSrc(friend) : ''}>
                      {friend.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={friend.username} />
                  <Checkbox
                    checked={isSelected}
                    sx={{
                      color: 'var(--primary-color, #128C7E)',
                      '&.Mui-checked': { color: 'var(--primary-color, #128C7E)' }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {dbFriends.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No friends to share with</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirmShare}
          disabled={selectedShareFriends.length === 0}
          variant="contained"
          sx={{
            bgcolor: 'var(--primary-color, #128C7E)',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareFriendsDialog;
