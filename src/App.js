import React from "react";
import {
  ChakraProvider,
  Box,
  Flex,
  useBreakpointValue,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import theme from "./theme";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DirectoryManager from "./pages/DirectoryManager";
import Settings from "./pages/Settings";
import Globe from "./pages/Globe";
import Districts from "./pages/Districts";
import LocalCongregations from "./pages/LocalCongregations";

const App = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <ChakraProvider theme={theme}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Flex direction="column" width="100vw" height="100vh" overflow="hidden">

          {/* MOBILE: Hamburger Button + Drawer */}
          {isMobile ? (
            <>
              <IconButton
                icon={<FaBars />}
                position="fixed"
                top={3}
                left={4}
                zIndex="200"
                onClick={onOpen}
                variant="solid"
                colorScheme="blue"
                borderRadius="full"
                size="sm"
                shadow="lg"
                aria-label="Open Menu"
              />
              <Sidebar isMobile={true} isOpen={isOpen} onClose={onClose} />
            </>
          ) : (
            /* DESKTOP: Top Menu Bar */
            <Sidebar isMobile={false} />
          )}

          {/* Main Content Area */}
          <Box
            flex="1"
            overflow="hidden"
            pt={isMobile ? "60px" : 0}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/directory-manager" element={<DirectoryManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/globe" element={<Globe />} />
              <Route path="/districts" element={<Districts />} />
              <Route path="/local-congregations" element={<LocalCongregations />} />
            </Routes>
          </Box>

        </Flex>
      </Router>
    </ChakraProvider>
  );
};

export default App;
