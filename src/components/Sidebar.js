import React, { useState } from "react";
import {
    Box,
    HStack,
    Icon,
    Text,
    Tooltip,
    IconButton,
    useColorMode,
    useColorModeValue,
    Switch,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerBody,
    VStack,
    Flex,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaHome,
    FaAddressBook,
    FaMapMarkerAlt,
    FaCog,
    FaSun,
    FaMoon,
    FaBars,
} from "react-icons/fa";
import { motion } from "framer-motion";

const navItems = [
    { icon: FaHome, label: "Dashboard", path: "/" },
    { icon: FaAddressBook, label: "Districts Manager", path: "/directory-manager" },
    { icon: FaMapMarkerAlt, label: "Find Congregation", path: "/local-congregations" },
    { icon: FaCog, label: "Settings", path: "/settings" },
];

const NavItem = ({ icon, label, path, active, onClick, activeBg, hoverBg, activeColor, inactiveColor, hoverColor }) => (
    <Tooltip label={label} placement="bottom" hasArrow openDelay={400}>
        <HStack
            as={motion.div}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            px={4}
            py={2}
            cursor="pointer"
            borderRadius="lg"
            bg={active ? activeBg : "transparent"}
            color={active ? activeColor : inactiveColor}
            _hover={{ bg: active ? activeBg : hoverBg, color: active ? activeColor : hoverColor }}
            transition="all 0.2s"
            onClick={() => onClick(path)}
            spacing={2}
            borderBottom="2px solid"
            borderBottomColor={active ? "blue.400" : "transparent"}
            borderBottomRadius="0"
            mb="-2px"
        >
            <Icon as={icon} fontSize="sm" />
            <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap" letterSpacing="tight">
                {label}
            </Text>
        </HStack>
    </Tooltip>
);

const MobileNavItem = ({ icon, label, path, active, onClick, activeBg, inactiveColor, activeColor }) => (
    <HStack
        w="100%"
        px={4}
        py={3}
        cursor="pointer"
        borderRadius="xl"
        bg={active ? activeBg : "transparent"}
        color={active ? activeColor : inactiveColor}
        spacing={4}
        onClick={() => onClick(path)}
        _hover={{ bg: activeBg, color: activeColor }}
        transition="all 0.2s"
    >
        <Icon as={icon} fontSize="lg" />
        <Text fontWeight="bold" fontSize="md">{label}</Text>
    </HStack>
);

const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { colorMode, toggleColorMode } = useColorMode();

    const bg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(10,15,26,0.95)");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    const logoColor = useColorModeValue("blue.600", "blue.300");
    const itemActiveBg = useColorModeValue("blue.500", "blue.600");
    const itemHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
    const itemInactiveColor = useColorModeValue("gray.600", "gray.400");
    const itemHoverColor = useColorModeValue("gray.900", "white");

    const handleClick = (path) => {
        navigate(path);
        if (isMobile && onClose) onClose();
    };

    // --- MOBILE DRAWER ---
    if (isMobile) {
        return (
            <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
                <DrawerOverlay backdropFilter="blur(6px)" />
                <DrawerContent bg={bg} border="none" shadow="2xl" maxW="240px">
                    <DrawerBody pt={8} px={4}>
                        <VStack align="stretch" spacing={1}>
                            {/* Logo */}
                            <Box mb={6} px={2}>
                                <Text fontWeight="black" color={logoColor} fontSize="2xl" letterSpacing="tighter">
                                    INC
                                </Text>
                                <Text fontSize="8px" fontWeight="black" color="gray.500" letterSpacing="2px">
                                    DIRECTORY
                                </Text>
                            </Box>

                            {/* Nav Links */}
                            {navItems.map((item) => (
                                <MobileNavItem
                                    key={item.path}
                                    {...item}
                                    active={location.pathname === item.path}
                                    onClick={handleClick}
                                    activeBg={itemActiveBg}
                                    activeColor="white"
                                    inactiveColor={itemInactiveColor}
                                />
                            ))}

                            {/* Theme Toggle */}
                            <HStack px={4} py={3} mt={4} borderRadius="xl" bg={itemHoverBg} justify="space-between">
                                <HStack spacing={2} color={itemInactiveColor}>
                                    <Icon as={colorMode === "light" ? FaSun : FaMoon} color="orange.400" />
                                    <Text fontSize="sm" fontWeight="bold">
                                        {colorMode === "light" ? "LIGHT" : "DARK"} MODE
                                    </Text>
                                </HStack>
                                <Switch size="sm" isChecked={colorMode === "dark"} onChange={toggleColorMode} colorScheme="blue" />
                            </HStack>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        );
    }

    // --- DESKTOP MENU BAR ---
    return (
        <Box
            w="100%"
            h="58px"
            bg={bg}
            backdropFilter="blur(20px)"
            borderBottom="1px solid"
            borderColor={borderColor}
            position="sticky"
            top="0"
            zIndex="100"
            shadow="sm"
            flexShrink={0}
        >
            <Flex h="100%" px={6} align="center" justify="space-between">
                {/* Logo */}
                <HStack spacing={2} mr={8}>
                    <Text fontWeight="black" color={logoColor} fontSize="xl" letterSpacing="tighter">
                        INC
                    </Text>
                    <Text fontSize="8px" fontWeight="black" color="gray.500" letterSpacing="2px" mt="2px">
                        DIRECTORY
                    </Text>
                </HStack>

                {/* Nav Links */}
                <HStack spacing={1} flex="1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                            onClick={handleClick}
                            activeBg={itemActiveBg}
                            hoverBg={itemHoverBg}
                            activeColor="white"
                            inactiveColor={itemInactiveColor}
                            hoverColor={itemHoverColor}
                        />
                    ))}
                </HStack>

                {/* Theme Toggle */}
                <HStack spacing={3} ml={4}>
                    <Icon as={colorMode === "light" ? FaSun : FaMoon} color="orange.400" fontSize="sm" />
                    <Switch size="sm" isChecked={colorMode === "dark"} onChange={toggleColorMode} colorScheme="blue" />
                </HStack>
            </Flex>
        </Box>
    );
};

export default Sidebar;
