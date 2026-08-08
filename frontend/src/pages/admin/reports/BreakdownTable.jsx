import { Box, Table, TableHead, TableBody, TableRow, TableCell, Typography, Button, LinearProgress } from '@mui/material';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { downloadCsv } from '../../../utils/csvExport';

export default function BreakdownTable({ title, rows, loading, filename, countLabel = 'எண்ணிக்கை' }) {
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

  const handleExport = () => {
    downloadCsv(
      filename,
      ['Tamil', 'English', 'Count'],
      rows.map((r) => [r.name_tamil ?? r.age_band, r.name_english ?? '', r.count])
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined />} onClick={handleExport} disabled={loading || rows.length === 0}>
          CSV ஏற்றுமதி
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">தரவு இல்லை</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>பெயர்</TableCell>
              <TableCell align="right">{countLabel}</TableCell>
              <TableCell align="right">%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  {r.name_tamil ?? r.age_band}
                  {r.name_english && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      ({r.name_english})
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{r.count}</TableCell>
                <TableCell align="right">{total ? ((Number(r.count) / total) * 100).toFixed(1) : 0}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
