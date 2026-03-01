import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/shared/AppShell";
import CollectionRoute from "@/routes/collection";
import BuildRoute from "@/routes/build";
import OverviewRoute from "@/routes/overview";
import SettingsRoute from "@/routes/settings";

declare global {
  interface Window {
    __openAddKitDialog?: () => void;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/collection" element={<CollectionRoute />} />
          <Route path="/build" element={<BuildRoute />} />
          <Route path="/overview" element={<OverviewRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="*" element={<Navigate to="/collection" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
