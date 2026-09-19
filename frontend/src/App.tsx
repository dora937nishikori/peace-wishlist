import {
  Route,
  Routes,
} from "react-router";

import CreateGroupPage
  from "./pages/CreateGroupPage";

import GroupPage
  from "./pages/GroupPage";

import WishItemPage
  from "./pages/WishItemPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <CreateGroupPage />
        }
      />

      <Route
        path="/groups/:groupId"
        element={
          <GroupPage />
        }
      />

      <Route
        path="/groups/:groupId/items/:itemId"
        element={
          <WishItemPage />
        }
      />
    </Routes>
  );
}

export default App;
