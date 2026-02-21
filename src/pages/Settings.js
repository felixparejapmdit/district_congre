import React, { useState } from "react";
import {
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Icon,
    Button,
    IconButton,
    useToast,
    Progress,
    Badge,
    Divider,
    useBreakpointValue,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSync, FaDatabase, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";

const Settings = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [syncStats, setSyncStats] = useState({ percentage: 0, currentDistrict: "" });
    const isMobile = useBreakpointValue({ base: true, md: false });

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncStats({ percentage: 0, currentDistrict: "Initializing..." });

        const customToast = (title, description, status) => {
            const bg = status === "success" ? "emerald.500" : status === "error" ? "red.500" : "blue.500";
            const icon = status === "success" ? FaCheckCircle : status === "error" ? FaExclamationTriangle : FaSync;

            toast({
                position: "top-right",
                duration: 5000,
                render: () => (
                    <Box
                        bg={bg}
                        p={5}
                        color="white"
                        borderRadius="2xl"
                        shadow="2xl"
                        backdropFilter="blur(15px)"
                        border="1px solid rgba(255,255,255,0.2)"
                        maxW="400px"
                        m={4}
                    >
                        <Flex align="start" gap={4}>
                            <Box flexShrink={0} mt={1}>
                                <Icon as={icon} w={5} h={5} />
                            </Box>
                            <VStack align="start" spacing={1} flex="1">
                                <Text fontWeight="black" fontSize="sm" lineHeight="tight">{title}</Text>
                                <Text fontSize="xs" opacity={0.9} fontWeight="medium">{description}</Text>
                            </VStack>
                            <IconButton
                                icon={<Text fontSize="xs">✕</Text>}
                                variant="ghost"
                                size="xs"
                                color="white"
                                _hover={{ bg: "whiteAlpha.200" }}
                                onClick={() => toast.closeAll()}
                                aria-label="Close"
                                flexShrink={0}
                            />
                        </Flex>
                    </Box>
                )
            });
        };

        customToast(
            "Synchronization Started",
            "Updating districts and congregations. This may take several minutes.",
            "info"
        );

        // Polling Progress
        const pollInterval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/sync/progress`);
                setSyncStats({
                    percentage: data.percentage,
                    currentDistrict: data.currentDistrict
                });
                if (data.status === "completed" || data.status === "failed") {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error("Poll error:", error);
            }
        }, 1500);

        try {
            const { data } = await axios.post(`${API_BASE}/sync/directory`);
            setSyncResult(data);
            setSyncStats({ percentage: 100, currentDistrict: "Done!" });
            customToast("Sync Successful", data.message, "success");
        } catch (error) {
            console.error("Sync error:", error);
            customToast(
                "Sync Failed",
                error.response?.data?.error || "An unexpected error occurred during synchronization.",
                "error"
            );
        } finally {
            setIsSyncing(false);
            clearInterval(pollInterval);
        }
    };

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
                h="100%"
                p={6}
            >
                {/* Header */}
                <Flex justify="space-between" align="center" mb={10}>
                    <HStack spacing={4}>
                        <IconButton
                            icon={<FaArrowLeft />}
                            onClick={() => navigate("/")}
                            variant="ghost"
                            colorScheme="whiteAlpha"
                            borderRadius="full"
                            aria-label="Back"
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontSize="2xl" fontWeight="black" color="white" letterSpacing="tight">
                                SYSTEM SETTINGS
                            </Text>
                            <Text color="blue.300" fontSize="xs" fontWeight="bold" letterSpacing="widest">
                                DATABASE MANAGEMENT & SYNCHRONIZATION
                            </Text>
                        </VStack>
                    </HStack>
                </Flex>

                <Flex flex="1" justify="center" align="center">
                    <Box
                        w="100%"
                        maxW="800px"
                        bg="rgba(255, 255, 255, 0.9)"
                        backdropFilter="blur(20px)"
                        borderRadius="3xl"
                        p={8}
                        shadow="2xl"
                        border="1px solid rgba(255, 255, 255, 0.4)"
                    >
                        <VStack spacing={8} align="stretch">
                            <Flex justify="space-between" align="center">
                                <HStack spacing={4}>
                                    <Box p={3} bg="blue.500" borderRadius="2xl" color="white" shadow="lg">
                                        <FaDatabase size={24} />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="xl" fontWeight="black" color="gray.800">Directory Generation</Text>
                                        <Text fontSize="sm" color="gray.500" fontWeight="medium">Update Local Database from Official INC Directory</Text>
                                    </VStack>
                                </HStack>
                            </Flex>

                            <Box p={6} bg="blue.50" borderRadius="2xl" border="1px dashed" borderColor="blue.200">
                                <VStack spacing={4} align="start">
                                    <HStack spacing={3} color="blue.700">
                                        <FaExclamationTriangle />
                                        <Text fontWeight="bold" fontSize="sm">Synchronization Policy</Text>
                                    </HStack>
                                    <Text fontSize="sm" color="blue.600">
                                        This process will scrape the official directory and update your local tables (Districts and Local Congregations).
                                        <strong> Existing IDs are preserved</strong> to maintain compatibility with external API consumers.
                                    </Text>
                                </VStack>
                            </Box>

                            <Box>
                                {isSyncing ? (
                                    <VStack spacing={6} py={10}>
                                        <Box w="100%" position="relative">
                                            <Progress
                                                size="lg"
                                                value={syncStats.percentage}
                                                borderRadius="full"
                                                colorScheme="blue"
                                                bg="blue.100"
                                                hasStripe
                                                isAnimated
                                            />
                                            <Text
                                                position="absolute"
                                                top="-25px"
                                                right="0"
                                                fontSize="sm"
                                                fontWeight="black"
                                                color="blue.600"
                                            >
                                                {syncStats.percentage}%
                                            </Text>
                                        </Box>
                                        <VStack spacing={2}>
                                            <Text fontWeight="black" color="blue.600" letterSpacing="widest" fontSize="sm" textTransform="uppercase">
                                                Syncing: {syncStats.currentDistrict}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500" textAlign="center">
                                                Please do not close this window. We are fetching and updating records.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                ) : (
                                    <Button
                                        size="lg"
                                        w="100%"
                                        colorScheme="blue"
                                        leftIcon={<FaSync />}
                                        onClick={handleSync}
                                        borderRadius="2xl"
                                        h="70px"
                                        fontSize="lg"
                                        fontWeight="black"
                                        shadow="xl"
                                        _hover={{ transform: "translateY(-2px)", shadow: "2xl" }}
                                    >
                                        GENERATE DATA
                                    </Button>
                                )}
                            </Box>

                            <AnimatePresence>
                                {syncResult && (
                                    <Box
                                        as={motion.div}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        p={6}
                                        bg="emerald.50"
                                        borderRadius="2xl"
                                        border="1px solid"
                                        borderColor="emerald.200"
                                    >
                                        <VStack align="stretch" spacing={4}>
                                            <HStack color="emerald.600" spacing={2}>
                                                <FaCheckCircle />
                                                <Text fontWeight="black">SYNC RESULTS</Text>
                                            </HStack>
                                            <Divider borderColor="emerald.200" />
                                            <SimpleGrid columns={2} spacing={4}>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontSize="xs" color="emerald.600" fontWeight="bold">DISTRICTS PROCESSED</Text>
                                                    <Text fontSize="xl" fontWeight="black" color="emerald.900">{syncResult.stats.districtsProcessed}</Text>
                                                    <Badge colorScheme="emerald" size="sm">+{syncResult.stats.districtsCreated} NEW</Badge>
                                                </VStack>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontSize="xs" color="emerald.600" fontWeight="bold">LOCALES PROCESSED</Text>
                                                    <Text fontSize="xl" fontWeight="black" color="emerald.900">{syncResult.stats.localesProcessed}</Text>
                                                    <Badge colorScheme="emerald" size="sm">+{syncResult.stats.localesCreated} NEW</Badge>
                                                </VStack>
                                            </SimpleGrid>
                                        </VStack>
                                    </Box>
                                )}
                            </AnimatePresence>
                        </VStack>
                    </Box>
                </Flex>
            </Flex>
        </Box>
    );
};

export default Settings;

// Helper to use SimpleGrid which was missing from basic Chakra imports in the snippet
const SimpleGrid = ({ children, columns, spacing }) => (
    <Box display="grid" gridTemplateColumns={`repeat(${columns}, 1fr)`} gap={spacing}>
        {children}
    </Box>
);
