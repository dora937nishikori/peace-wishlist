import {
  Route,
  Routes,
} from "react-router";

import CreateGroupPage
  from "./pages/CreateGroupPage";

import GroupPage
  from "./pages/GroupPage";

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
    </Routes>
  );
}

export default App;