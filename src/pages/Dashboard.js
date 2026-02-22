import React, { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Text,
    SimpleGrid,
    VStack,
    HStack,
    Icon,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Spinner,
    useColorModeValue,
    useColorMode,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGlobeAsia, FaMapMarkerAlt, FaPlusCircle, FaSync } from "react-icons/fa";
import axios from "axios";

const envApiUrl = process.env.REACT_APP_API_URL || "";
const API_BASE = (envApiUrl === "/" ? "" : (envApiUrl || "http://localhost:3001")) + "/api";

const Dashboard = () => {
    const [stats, setStats] = useState({ districtCount: 0, congregationCount: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { colorMode } = useColorMode();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/dashboard/stats`);
                setStats(data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Theme-specific values
    const overlayColor = useColorModeValue("rgba(255, 255, 255, 0.6)", "rgba(0, 0, 0, 0.7)");
    const cardBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.85)");
    const darkCardBg = useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(0, 0, 0, 0.4)");
    const titleColor = useColorModeValue("blue.800", "white");
    const statNumColor = useColorModeValue("blue.600", "blue.900");
    const emeraldStatColor = useColorModeValue("green.600", "emerald.900");
    const contrastText = useColorModeValue("gray.800", "white");
    const subTitleColor = useColorModeValue("blue.600", "blue.200");
    const districtBorderColor = useColorModeValue("blue.100", "whiteAlpha.500");
    const localeBorderColor = useColorModeValue("green.100", "whiteAlpha.500");
    const dataMgmtBorderColor = useColorModeValue("orange.100", "whiteAlpha.100");
    const dataMgmtLabelColor = useColorModeValue("gray.500", "gray.400");
    const syncBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
    const syncHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
    const blurEffect = "blur(15px)";

    return (
        <Box
            w="100%"
            h="100vh"
            backgroundImage="url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
            backgroundSize="cover"
            backgroundPosition="center"
            position="relative"
            overflow="hidden"
        >
            {/* Background Overlay */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                bg={overlayColor}
                backdropFilter={colorMode === 'light' ? "brightness(1.1) blur(2px)" : "brightness(0.6)"}
                transition="all 0.5s ease"
            />

            <Flex
                position="relative"
                zIndex="1"
                direction="column"
                align="center"
                justify="center"
                h="100%"
                p={6}
            >
                <VStack spacing={8} w="100%" maxW="1200px">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <VStack spacing={2} textAlign="center">
                            <Text
                                fontSize={{ base: "3xl", md: "5xl" }}
                                fontWeight="black"
                                color={titleColor}
                                letterSpacing="tighter"
                                textShadow={colorMode === 'dark' ? "0 4px 10px rgba(0,0,0,0.3)" : "none"}
                            >
                                DIRECTORY DASHBOARD
                            </Text>
                            <Text color={subTitleColor} fontWeight="bold" fontSize="lg">
                                Iglesia Ni Cristo Management System
                            </Text>
                        </VStack>
                    </motion.div>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="100%">
                        {/* DISTRICTS STAT */}
                        <Box
                            as={motion.div}
                            whileHover={{ scale: 1.05, y: -10 }}
                            onClick={() => navigate("/directory-manager")}
                            cursor="pointer"
                        >
                            <Box
                                bg={cardBg}
                                backdropFilter={blurEffect}
                                p={8}
                                borderRadius="3xl"
                                shadow="2xl"
                                border="1px solid"
                                borderColor={districtBorderColor}
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaGlobeAsia} w={12} h={12} color="blue.500" />
                                    <Stat>
                                        <StatLabel fontWeight="black" color="gray.500" fontSize="sm">TOTAL DISTRICTS</StatLabel>
                                        {loading ? <Spinner mt={2} /> : (
                                            <StatNumber fontSize="5xl" fontWeight="black" color={statNumColor}>
                                                {stats.districtCount}
                                            </StatNumber>
                                        )}
                                        <StatHelpText color="blue.400" fontWeight="bold">
                                            Across the Globe
                                        </StatHelpText>
                                    </Stat>
                                    <Text fontSize="xs" fontWeight="black" color="blue.600" textTransform="uppercase">
                                        Click to Manage Districts
                                    </Text>
                                </VStack>
                            </Box>
                        </Box>

                        {/* LOCALES STAT */}
                        <Box
                            as={motion.div}
                            whileHover={{ scale: 1.05, y: -10 }}
                            onClick={() => navigate("/local-congregations")}
                            cursor="pointer"
                        >
                            <Box
                                bg={cardBg}
                                backdropFilter={blurEffect}
                                p={8}
                                borderRadius="3xl"
                                shadow="2xl"
                                border="1px solid"
                                borderColor={localeBorderColor}
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaMapMarkerAlt} w={12} h={12} color="green.500" />
                                    <Stat>
                                        <StatLabel fontWeight="black" color="gray.500" fontSize="sm">LOCAL CONGREGATIONS</StatLabel>
                                        {loading ? <Spinner mt={2} /> : (
                                            <StatNumber fontSize="5xl" fontWeight="black" color={emeraldStatColor}>
                                                {stats.congregationCount}
                                            </StatNumber>
                                        )}
                                        <StatHelpText color="green.400" fontWeight="bold">
                                            Officially Registered
                                        </StatHelpText>
                                    </Stat>
                                    <Text fontSize="xs" fontWeight="black" color="green.600" textTransform="uppercase">
                                        View Detailed Directory
                                    </Text>
                                </VStack>
                            </Box>
                        </Box>

                        {/* DATA MANAGEMENT STAT */}
                        <Box
                            as={motion.div}
                            whileHover={{ scale: 1.05, y: -10 }}
                            onClick={() => navigate("/settings")}
                            cursor="pointer"
                        >
                            <Box
                                bg={darkCardBg}
                                backdropFilter={blurEffect}
                                p={8}
                                borderRadius="3xl"
                                shadow="2xl"
                                border="1px solid"
                                borderColor={dataMgmtBorderColor}
                                color={contrastText}
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaPlusCircle} w={12} h={12} color="orange.400" />
                                    <VStack spacing={1}>
                                        <Text fontWeight="black" fontSize="sm" color={dataMgmtLabelColor}>DATA MANAGEMENT</Text>
                                        <Text fontSize="lg" fontWeight="bold">Regenerate Directory</Text>
                                    </VStack>
                                    <VStack w="100%" spacing={3}>
                                        <HStack
                                            w="100%"
                                            p={3}
                                            bg={syncBg}
                                            borderRadius="xl"
                                            _hover={{ bg: syncHoverBg }}
                                        >
                                            <FaSync />
                                            <VStack align="start" spacing={0}>
                                                <Text fontSize="sm" fontWeight="bold">Sync Tables</Text>
                                                <Text fontSize="10px" opacity={0.6}>Preserves existing IDs</Text>
                                            </VStack>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            </Box>
                        </Box>
                    </SimpleGrid>
                </VStack>
            </Flex>
        </Box>
    );
};

export default Dashboard;
