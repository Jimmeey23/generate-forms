import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@project/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import FormPreview from './pages/FormPreview';
import FormFill from './pages/FormFill';
import FormSubmissions from './pages/FormSubmissions';
import SuccessPage from './pages/SuccessPage';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ClassSchedule from './pages/ClassSchedule';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form/:id/preview" element={<FormPreview />} />
        <Route path="/form/:id/submissions" element={<FormSubmissions />} />
        <Route path="/f/:slug" element={<FormFill />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
        <Route path="/classes/:memberId" element={<ClassSchedule />} />
      </Routes>
    </BrowserRouter>
  );
}
