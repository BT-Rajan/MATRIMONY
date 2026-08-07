import { useEffect, useState } from 'react';
import { Button, Menu, MenuItem, IconButton, ListItemText, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import { savedSearchService } from '../../../services/savedSearchService';
import { useToast } from '../../../contexts/ToastContext';

export default function SavedSearchesMenu({ currentFilters, onApply }) {
  const toast = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searches, setSearches] = useState([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const load = () => {
    savedSearchService
      .list()
      .then((res) => setSearches(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error('பெயர் தேவை');
      return;
    }
    const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    if (Object.keys(activeFilters).length === 0) {
      toast.error('சேமிக்க குறைந்தது ஒரு வடிகட்டி தேவை');
      return;
    }
    try {
      await savedSearchService.create(saveName.trim(), activeFilters);
      toast.success('தேடல் சேமிக்கப்பட்டது');
      setSaveOpen(false);
      setSaveName('');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await savedSearchService.remove(id);
      toast.success('நீக்கப்பட்டது');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<BookmarkBorderOutlined />} onClick={(e) => setAnchorEl(e.currentTarget)}>
        சேமித்த தேடல்கள்
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); setSaveOpen(true); }}>
          + தற்போதைய தேடலை சேமி
        </MenuItem>
        {searches.length === 0 ? (
          <MenuItem disabled>சேமித்த தேடல்கள் இல்லை</MenuItem>
        ) : (
          searches.map((s) => (
            <MenuItem
              key={s.id}
              onClick={() => {
                onApply(s.filters);
                setAnchorEl(null);
              }}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              <ListItemText primary={s.name} />
              <IconButton size="small" onClick={(e) => handleDelete(s.id, e)}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
      </Menu>

      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>தேடலை சேமி</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label="பெயர்"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            sx={{ mt: 1 }}
            placeholder="எ.கா. மதுரையில் மணமகள் 25-30"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            தற்போது பயன்பாட்டில் உள்ள தேடல் வடிகட்டிகள் சேமிக்கப்படும்.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSaveOpen(false)}>ரத்து</Button>
          <Button variant="contained" onClick={handleSave}>
            சேமி
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
