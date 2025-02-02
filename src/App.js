import React from "react";
import { ChakraProvider, Box } from "@chakra-ui/react";
import Globe from "./pages/Globe"; // ✅ FIXED IMPORT

const App = () => {
  return (
    <ChakraProvider>
      <Box width="100vw" height="100vh">
        <Globe /> {/* ✅ USING GLOBE COMPONENT */}
      </Box>
    </ChakraProvider>
  );
};

export default App;
