import React from "react";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DirectoryManager from "./pages/DirectoryManager";
import Settings from "./pages/Settings";
import Globe from "./pages/Globe";
import Districts from "./pages/Districts";
import LocalCongregations from "./pages/LocalCongregations";

const App = () => {
  return (
    <ChakraProvider>
      <Router>
        <Box width="100vw" height="100vh">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/directory-manager" element={<DirectoryManager />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/globe" element={<Globe />} />
            <Route path="/districts" element={<Districts />} />
            <Route path="/local-congregations" element={<LocalCongregations />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App;
