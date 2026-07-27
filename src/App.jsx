import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PriceManipulation from './labs/PriceManipulation';
import NotFound from './pages/Notfound';
import OtpBypass from './labs/OtpBypass';
import IdorOrder from './labs/IdorOrder';
import GraphqlProfile from './labs/GraphqlProfile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root URL: thehackersblueprint.vercel.app/ */}
        <Route path="/" element={<Home />} />

        {/* Individual Lab Pages */}
        <Route path="/PriceManipulation" element={<PriceManipulation />} />
       
        <Route path="/OtpBypass" element={<OtpBypass />} />

        <Route path="/IdorOrder" element={<IdorOrder />} />

        <Route path="/GraphqlProfile" element={<GraphqlProfile />} />

        {/* Catch-all 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}