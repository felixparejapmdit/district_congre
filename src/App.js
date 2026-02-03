import React from "react";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Globe from "./pages/Globe";
import Districts from "./pages/Districts";
import LocalCongregations from "./pages/LocalCongregations";

const App = () => {
  return (
    <ChakraProvider>
      <Router>
        <Box width="100vw" height="100vh">
          <Routes>
            <Route path="/" element={<Globe />} />
            <Route path="/districts" element={<Districts />} />
            <Route path="/local-congregations" element={<LocalCongregations />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App;
