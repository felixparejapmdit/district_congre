import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    SimpleGrid,
    Badge,
    Spinner,
    IconButton,
    Button,
    Container,
    Divider,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    FaSearch,
    FaMapMarkerAlt,
    FaArrowLeft,
    FaClock,
    FaCar,
    FaGlobeAsia,
    FaCalendarAlt,
    FaInfoCircle
} from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";
const CENTRAL_OFFICE = { lat: 14.6508, lng: 121.0505 };

const LocalCongregations = () => {
    const navigate = useNavigate();
    const [congregations, setCongregations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocale, setSelectedLocale] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/all-congregations`);
                setCongregations(data);
            } catch (error) {
                console.error("Error fetching congregations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Haversine Formula for Distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    // Estimate Travel Time (assuming 30km/h average traffic speed)
    const estimateTravelTime = (distance) => {
        if (!distance) return null;
        const speed = 30; // km/h
        const timeInHours = distance / speed;
        const minutes = Math.round(timeInHours * 60);

        if (minutes < 60) return `${minutes} mins`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const filteredCongregations = useMemo(() => {
        return congregations.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.District?.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 50); // Limit to top 50 for performance
    }, [congregations, searchTerm]);

    const handleViewDetails = (locale) => {
        setSelectedLocale(locale);
        onOpen();
    };

    const cardBg = "rgba(255, 255, 255, 0.15)";
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
            color="white"
        >
            {/* Background Overlay */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                bgGradient="linear(to-br, rgba(0,0,0,0.8), rgba(0,0,0,0.4))"
                backdropFilter="brightness(0.5)"
            />

            <Flex
                position="relative"
                zIndex="1"
                direction="column"
                h="100%"
            >
                {/* Header */}
                <Box p={6} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
                    <Container maxW="1200px">
                        <Flex justify="space-between" align="center">
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
                                    <Text fontSize="2xl" fontWeight="black" letterSpacing="tight">
                                        CONGREGATION SEARCH
                                    </Text>
                                    <Text color="blue.300" fontSize="xs" fontWeight="bold">
                                        GLOBAL DIRECTORY & DISTANCE TRACKER
                                    </Text>
                                </VStack>
                            </HStack>
                            <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs">
                                {congregations.length} TOTAL LOCALES
                            </Badge>
                        </Flex>

                        <InputGroup mt={6} size="lg">
                            <InputLeftElement pointerEvents="none">
                                <FaSearch color="rgba(255,255,255,0.4)" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search by name or district..."
                                bg="rgba(255, 255, 255, 0.1)"
                                border="1px solid rgba(255, 255, 255, 0.2)"
                                _hover={{ bg: "rgba(255, 255, 255, 0.15)" }}
                                _focus={{ border: "1px solid", borderColor: "blue.400", bg: "rgba(255, 255, 255, 0.2)" }}
                                backdropFilter="blur(10px)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Container>
                </Box>

                {/* Content */}
                <Box flex="1" overflowY="auto" p={6}>
                    <Container maxW="1200px">
                        {loading ? (
                            <Flex justify="center" align="center" h="50vh">
                                <VStack spacing={4}>
                                    <Spinner size="xl" color="blue.400" thickness="4px" />
                                    <Text fontWeight="bold" color="blue.300">Scanning Database...</Text>
                                </VStack>
                            </Flex>
                        ) : (
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                <AnimatePresence>
                                    {filteredCongregations.map((c, i) => {
                                        const dist = calculateDistance(CENTRAL_OFFICE.lat, CENTRAL_OFFICE.lng, c.latitude, c.longitude);
                                        const time = estimateTravelTime(parseFloat(dist));

                                        return (
                                            <Box
                                                key={c.id}
                                                as={motion.div}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                whileHover={{ y: -5 }}
                                                onClick={() => handleViewDetails(c)}
                                                cursor="pointer"
                                            >
                                                <Box
                                                    bg={cardBg}
                                                    backdropFilter={blurEffect}
                                                    borderRadius="2xl"
                                                    p={5}
                                                    border="1px solid rgba(255, 255, 255, 0.1)"
                                                    _hover={{ border: "1px solid rgba(255, 255, 255, 0.3)", shadow: "2xl" }}
                                                >
                                                    <VStack align="start" spacing={3}>
                                                        <Flex w="100%" justify="space-between" align="start">
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="black" fontSize="lg" noOfLines={1}>
                                                                    {c.name}
                                                                </Text>
                                                                <Text fontSize="xs" color="blue.300" fontWeight="bold">
                                                                    {c.District?.name}
                                                                </Text>
                                                            </VStack>
                                                            <Icon as={FaMapMarkerAlt} color="emerald.400" />
                                                        </Flex>

                                                        <Divider borderColor="whiteAlpha.200" />

                                                        <HStack justify="space-between" w="100%">
                                                            <VStack align="start" spacing={0}>
                                                                <HStack spacing={1} color="gray.400">
                                                                    <FaCar size={10} />
                                                                    <Text fontSize="10px" fontWeight="black">TRAVEL FROM CENTRAL</Text>
                                                                </HStack>
                                                                <Text fontWeight="black" color="emerald.400" fontSize="sm">
                                                                    {dist ? `${dist} KM` : "Unknown"}
                                                                </Text>
                                                            </VStack>
                                                            <VStack align="end" spacing={0}>
                                                                <HStack spacing={1} color="gray.400">
                                                                    <FaClock size={10} />
                                                                    <Text fontSize="10px" fontWeight="black">EST. TIME</Text>
                                                                </HStack>
                                                                <Text fontWeight="black" color="blue.300" fontSize="sm">
                                                                    {time || "N/A"}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                    </VStack>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </AnimatePresence>
                            </SimpleGrid>
                        )}

                        {!loading && filteredCongregations.length === 0 && (
                            <Flex justify="center" align="center" h="30vh">
                                <Text color="whiteAlpha.600" fontWeight="bold">No congregations matched your search.</Text>
                            </Flex>
                        )}
                    </Container>
                </Box>
            </Flex>

            {/* Locale Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
                <ModalOverlay backdropFilter="blur(5px)" bg="rgba(0,0,0,0.4)" />
                <ModalContent bg="gray.900" color="white" borderRadius="3xl" border="1px solid rgba(255, 255, 255, 0.1)">
                    <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.1)" py={6}>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="2xl" fontWeight="black">{selectedLocale?.name}</Text>
                            <Text fontSize="sm" color="blue.400" fontWeight="bold">{selectedLocale?.District?.name}</Text>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton mt={4} />
                    <ModalBody p={8}>
                        <VStack spacing={8} align="stretch">
                            <SimpleGrid columns={2} spacing={10}>
                                <VStack align="start" spacing={4}>
                                    <HStack color="blue.300">
                                        <FaCalendarAlt />
                                        <Text fontWeight="black" fontSize="xs" letterSpacing="widest">WORSHIP SCHEDULE</Text>
                                    </HStack>
                                    <Box p={4} bg="whiteAlpha.100" borderRadius="2xl" w="100%">
                                        <Text fontSize="sm" whiteSpace="pre-wrap">
                                            {selectedLocale?.schedule || "Schedule not available yet.\nPlease refer to the official directory for latest updates."}
                                        </Text>
                                    </Box>
                                </VStack>

                                <VStack align="start" spacing={4}>
                                    <HStack color="emerald.400">
                                        <FaCar />
                                        <Text fontWeight="black" fontSize="xs" letterSpacing="widest">TRAVEL INSIGHTS</Text>
                                    </HStack>
                                    <VStack p={4} bg="whiteAlpha.100" borderRadius="2xl" w="100%" align="stretch" spacing={3}>
                                        <Flex justify="space-between">
                                            <Text fontSize="xs" color="gray.400">Straight Distance</Text>
                                            <Text fontSize="xs" fontWeight="bold">{calculateDistance(CENTRAL_OFFICE.lat, CENTRAL_OFFICE.lng, selectedLocale?.latitude, selectedLocale?.longitude)} KM</Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Text fontSize="xs" color="gray.400">Traffic Estimate</Text>
                                            <Text fontSize="xs" fontWeight="bold" color="blue.300">{estimateTravelTime(parseFloat(calculateDistance(CENTRAL_OFFICE.lat, CENTRAL_OFFICE.lng, selectedLocale?.latitude, selectedLocale?.longitude)))}</Text>
                                        </Flex>
                                        <Divider borderColor="whiteAlpha.100" />
                                        <VStack align="start" spacing={1}>
                                            <Text fontSize="10px" color="gray.500">COORDINATES</Text>
                                            <Text fontSize="xs">{selectedLocale?.latitude}, {selectedLocale?.longitude}</Text>
                                        </VStack>
                                    </VStack>
                                </VStack>
                            </SimpleGrid>

                            <VStack align="start" spacing={4}>
                                <HStack color="orange.400">
                                    <FaInfoCircle />
                                    <Text fontWeight="black" fontSize="xs" letterSpacing="widest">ADDRESS & LOCATION</Text>
                                </HStack>
                                <Box p={4} bg="whiteAlpha.100" borderRadius="2xl" w="100%">
                                    <Text fontSize="sm">{selectedLocale?.address || "Address details currently loading from central repository."}</Text>
                                </Box>
                            </VStack>
                        </VStack>
                    </ModalBody>
                    <Box p={6} borderTop="1px solid rgba(255, 255, 255, 0.1)" textAlign="right">
                        <Button colorScheme="blue" borderRadius="xl" onClick={onClose} size="sm">CLOSE DETAILS</Button>
                    </Box>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default LocalCongregations;
