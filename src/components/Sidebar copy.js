import React from "react";
import {
    Box,
    VStack,
    HStack,
    Icon,
    Text,
    Tooltip,
    Divider,
    IconButton,
    useColorMode,
    useColorModeValue,
    Switch,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaHome,
    FaAddressBook,
    FaMapMarkerAlt,
    FaCog,
    FaChevronLeft,
    FaChevronRight,
    FaSun,
    FaMoon,
} from "react-icons/fa";

const SidebarItem = ({ icon, label, path, active, isCollapsed, onClick, activeBg, hoverBg, activeColor, inactiveColor, hoverColor }) => {
    return (
        <Tooltip label={isCollapsed ? label : ""} placement="right" hasArrow>
            <HStack
                w="100%"
                p={3}
                cursor="pointer"
                borderRadius="xl"
                bg={active ? activeBg : "transparent"}
                color={active ? activeColor : inactiveColor}
                _hover={{
                    bg: active ? activeBg : hoverBg,
                    color: active ? activeColor : hoverColor
                }}
                transition="all 0.2s"
                onClick={() => onClick(path)}
                spacing={4}
                justify={isCollapsed ? "center" : "flex-start"}
            >
                <Icon as={icon} fontSize="lg" />
                {!isCollapsed && (
                    <Text fontWeight="bold" fontSize="sm" letterSpacing="tight">
                        {label}
                    </Text>
                )}
            </HStack>
        </Tooltip>
    );
};

const Sidebar = ({ isCollapsed, onToggle, isMobile }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { colorMode, toggleColorMode } = useColorMode();

    const bg = useColorModeValue("white", "rgba(10, 15, 26, 0.95)");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    const logoColor = useColorModeValue("blue.600", "blue.400");
    const themeBg = useColorModeValue("gray.50", "whiteAlpha.50");
    const toggleHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.200");

    // Colors for SidebarItem
    const itemActiveBg = useColorModeValue("blue.500", "blue.600");
    const itemHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
    const itemInactiveColor = useColorModeValue("gray.600", "gray.400");
    const itemHoverColor = useColorModeValue("black", "white");

    const navItems = [
        { icon: FaHome, label: "Dashboard", path: "/" },
        { icon: FaAddressBook, label: "Districts Manager", path: "/directory-manager" },
        { icon: FaMapMarkerAlt, label: "Find Congregation", path: "/local-congregations" },
    ];

    const handleClick = (path) => {
        navigate(path);
        if (isMobile) onToggle(); // Close mobile drawer on pick
    };

    return (
        <Box
            h="100vh"
            w={isCollapsed ? "80px" : "260px"}
            bg={bg}
            backdropFilter="blur(20px)"
            borderRight="1px solid"
            borderColor={borderColor}
            transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            display="flex"
            flexDirection="column"
            p={4}
            position="relative"
            zIndex="10"
        >
            {/* Logo Section */}
            <VStack align={isCollapsed ? "center" : "start"} mb={10} spacing={1} px={2} pt={isMobile ? 12 : 0}>
                <Text
                    fontWeight="black"
                    color={logoColor}
                    fontSize={isCollapsed ? "xl" : "2xl"}
                    letterSpacing="tighter"
                >
                    INC
                </Text>
                {!isCollapsed && (
                    <Text fontSize="8px" fontWeight="black" color="gray.500" letterSpacing="2px">
                        DIRECTORY
                    </Text>
                )}
            </VStack>

            {/* Navigation Items */}
            <VStack spacing={2} align="stretch" flex="1">
                {navItems.map((item) => (
                    <SidebarItem
                        key={item.path}
                        {...item}
                        active={location.pathname === item.path}
                        isCollapsed={isCollapsed}
                        onClick={handleClick}
                        activeBg={itemActiveBg}
                        hoverBg={itemHoverBg}
                        activeColor="white"
                        inactiveColor={itemInactiveColor}
                        hoverColor={itemHoverColor}
                    />
                ))}
            </VStack>

            <Divider borderColor={borderColor} my={4} />

            {/* Theme & Bottom Section */}
            <VStack spacing={2} align="stretch">
                <HStack
                    px={3}
                    py={2}
                    justify={isCollapsed ? "center" : "space-between"}
                    bg={themeBg}
                    borderRadius="xl"
                    mb={2}
                >
                    {!isCollapsed && (
                        <HStack spacing={2}>
                            <Icon as={colorMode === "light" ? FaSun : FaMoon} color="orange.400" />
                            <Text fontSize="xs" fontWeight="bold">
                                {colorMode === "light" ? "LIGHT" : "DARK"} MODE
                            </Text>
                        </HStack>
                    )}
                    <Switch
                        size="sm"
                        isChecked={colorMode === "dark"}
                        onChange={toggleColorMode}
                        colorScheme="blue"
                    />
                </HStack>

                <SidebarItem
                    icon={FaCog}
                    label="Settings"
                    path="/settings"
                    active={location.pathname === "/settings"}
                    isCollapsed={isCollapsed}
                    onClick={handleClick}
                    activeBg={itemActiveBg}
                    hoverBg={itemHoverBg}
                    activeColor="white"
                    inactiveColor={itemInactiveColor}
                    hoverColor={itemHoverColor}
                />

                {!isMobile && (
                    <IconButton
                        icon={isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                        onClick={onToggle}
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        size="sm"
                        w="100%"
                        mt={4}
                        _hover={{ bg: toggleHoverBg }}
                        aria-label="Toggle Sidebar"
                    />
                )}
            </VStack>
        </Box>
    );
};

export default Sidebar;
