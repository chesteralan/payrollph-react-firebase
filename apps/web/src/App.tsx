import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./context/AppProviders";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AppRoutes } from "./App.routes";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
