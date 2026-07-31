import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PriceManipulation from './labs/PriceManipulation';
import NotFound from './pages/Notfound';
import OtpBypass from './labs/OtpBypass';
import IdorOrder from './labs/IdorOrder';
import GraphqlProfile from './labs/GraphqlProfile';
import ReflectedXss from './labs/ReflectedXss';
import RaceCondition from './labs/RaceCondition';
import PreATO from './labs/PreATO';
import SubdomainTakeover from './labs/SubdomainTakeover';

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

        <Route path="/ReflectedXss" element={<ReflectedXss />} />

        <Route path="/RaceCondition" element={<RaceCondition />} />

        <Route path="/PreATO" element={<PreATO />} />
        
        <Route path="/SubdomainTakeover" element={<SubdomainTakeover />} />

        {/* Catch-all 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}