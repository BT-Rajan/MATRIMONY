import { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';

export default function FileDropInput({ label, hint, accept, file, onChange, error, existingLabel }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (file && file.type?.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: '1px dashed',
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        {previewUrl ? (
          <Box component="img" src={previewUrl} sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover' }} />
        ) : file ? (
          <InsertDriveFileOutlined color="action" />
        ) : (
          <UploadFileOutlined color="disabled" />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {file ? file.name : existingLabel || 'கோப்பு தேர்ந்தெடுக்கப்படவில்லை'}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="outlined" onClick={() => inputRef.current?.click()}>
            தேர்ந்தெடு
          </Button>
          {file && (
            <IconButton size="small" onClick={() => onChange(null)}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
