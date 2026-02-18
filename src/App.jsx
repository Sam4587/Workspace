import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { navItems } from "./nav-items";
import Layout from "./components/Layout";
import TranscriptionResult from "./pages/TranscriptionResult";
import ContentRewrite from "./pages/ContentRewrite";
import { ThemeProvider } from "./providers/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Layout>
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
              <Route path="/transcription/:videoId" element={<TranscriptionResult />} />
              <Route path="/content-rewrite" element={<ContentRewrite />} />
              <Route path="/content-generation" element={<Navigate to="/content-creation" replace />} />
              <Route path="/publish-management" element={<Navigate to="/publish-center" replace />} />
              <Route path="/video-generation" element={<Navigate to="/content-creation" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
