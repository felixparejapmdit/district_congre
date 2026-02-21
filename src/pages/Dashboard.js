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
    useBreakpointValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGlobeAsia, FaMapMarkerAlt, FaChartLine, FaPlusCircle, FaSync } from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";

const Dashboard = () => {
    const [stats, setStats] = useState({ districtCount: 0, congregationCount: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    const cardBg = "rgba(255, 255, 255, 0.85)";
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
                bgGradient="radial(circle at center, transparent, rgba(0,0,0,0.7))"
                backdropFilter="brightness(0.6)"
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
                                color="white"
                                letterSpacing="tighter"
                                textShadow="0 4px 10px rgba(0,0,0,0.3)"
                            >
                                DIRECTORY DASHBOARD
                            </Text>
                            <Text color="blue.200" fontWeight="bold" fontSize="lg">
                                Iglesia Ni Cristo Management System
                            </Text>
                        </VStack>
                    </motion.div>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
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
                                border="1px solid rgba(255, 255, 255, 0.5)"
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaGlobeAsia} w={12} h={12} color="blue.500" />
                                    <Stat>
                                        <StatLabel fontWeight="black" color="gray.500" fontSize="sm">TOTAL DISTRICTS</StatLabel>
                                        {loading ? <Spinner mt={2} /> : (
                                            <StatNumber fontSize="5xl" fontWeight="black" color="blue.900">
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
                                border="1px solid rgba(255, 255, 255, 0.5)"
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaMapMarkerAlt} w={12} h={12} color="emerald.500" />
                                    <Stat>
                                        <StatLabel fontWeight="black" color="gray.500" fontSize="sm">LOCAL CONGREGATIONS</StatLabel>
                                        {loading ? <Spinner mt={2} /> : (
                                            <StatNumber fontSize="5xl" fontWeight="black" color="emerald.900">
                                                {stats.congregationCount}
                                            </StatNumber>
                                        )}
                                        <StatHelpText color="emerald.400" fontWeight="bold">
                                            Officially Registered
                                        </StatHelpText>
                                    </Stat>
                                    <Text fontSize="xs" fontWeight="black" color="emerald.600" textTransform="uppercase">
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
                                bg="rgba(0, 0, 0, 0.4)"
                                backdropFilter={blurEffect}
                                p={8}
                                borderRadius="3xl"
                                shadow="2xl"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                color="white"
                                textAlign="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={FaPlusCircle} w={12} h={12} color="orange.400" />
                                    <VStack spacing={1}>
                                        <Text fontWeight="black" fontSize="sm" color="gray.400">DATA MANAGEMENT</Text>
                                        <Text fontSize="lg" fontWeight="bold">Regenerate Directory</Text>
                                    </VStack>
                                    <VStack w="100%" spacing={3}>
                                        <HStack
                                            w="100%"
                                            p={3}
                                            bg="whiteAlpha.100"
                                            borderRadius="xl"
                                            _hover={{ bg: "whiteAlpha.200" }}
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
