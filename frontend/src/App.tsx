import { Route, Routes } from "react-router";

import { AppFooter } from "./components/AppFooter";
import CreateGroupPage from "./pages/CreateGroupPage";
import GroupPage from "./pages/GroupPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import WishItemPage from "./pages/WishItemPage";

function App() {
  return (
    <div className="app-frame">
      <div className="app-content">
        <Routes>
          <Route path="/" element={<CreateGroupPage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route
            path="/groups/:groupId/items/:itemId"
            element={<WishItemPage />}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
