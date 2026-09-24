import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Apply from './pages/Apply';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
