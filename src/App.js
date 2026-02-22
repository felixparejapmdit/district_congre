import React, { useState } from "react";
import {
  ChakraProvider,
  Box,
  Flex,
  useBreakpointValue,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
  IconButton
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen, onOpen, onClose } = useDisclosure();


  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Flex width="100vw" height="100vh" overflow="hidden" position="relative">

          {/* MOBILE NAVIGATION */}
          {isMobile ? (
            <>
              <IconButton
                icon={<FaBars />}
                position="fixed"
                top={4}
                left={4}
                zIndex="20"
                onClick={onOpen}
                variant="solid"
                colorScheme="blue"
                borderRadius="full"
                shadow="lg"
                aria-label="Open Menu"
              />
              <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
                <DrawerOverlay backdropFilter="blur(4px)" />
                <DrawerContent bg="transparent" border="none" shadow="none">
                  <Sidebar
                    isCollapsed={false}
                    onToggle={onClose}
                    isMobile={true}
                  />
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            /* DESKTOP NAVIGATION */
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          )}

          {/* Main Content Area */}
          <Box
            flex="1"
            h="100vh"
            overflow="hidden"
            ml={0}
            transition="margin-left 0.3s"
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
