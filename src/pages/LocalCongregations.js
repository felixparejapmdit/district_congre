import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    useToast,
    Text,
    Badge,
    Card,
    CardBody,
    SimpleGrid,
    Stack,
    Skeleton,
    ButtonGroup,
    Tooltip,
    useColorModeValue
} from "@chakra-ui/react";
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaHome,
    FaChevronLeft,
    FaChevronRight,
    FaSyncAlt,
    FaFilter,
    FaMapMarkerAlt,
    FaList,
    FaTh
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LocalCongregations = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [congregations, setCongregations] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCong, setEditingCong] = useState(null);
    const [formData, setFormData] = useState({
        name: "", district_id: "", latitude: "", longitude: "", address: ""
    });

    // View Item State (true = grid, false = list)
    const [isGridView, setIsGridView] = useState(false);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDistrict, setFilterDistrict] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = isGridView ? 20 : 25; // Fit more in scrollable view

    // UI Hooks
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cardBg = useColorModeValue("white", "gray.700");
    const API_URL = process.env.REACT_APP_API_URL || "";

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [congRes, distRes] = await Promise.all([
                axios.get(`${API_URL}/api/all-congregations`),
                axios.get(`${API_URL}/api/districts`)
            ]);
            setCongregations(congRes.data);
            setDistricts(distRes.data);
        } catch (error) {
            toast({ title: "Error fetching data", status: "error", duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Filter Logic
    const filteredCongregations = useMemo(() => {
        return congregations.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistrict = filterDistrict ? c.district_id === parseInt(filterDistrict) : true;
            return matchesSearch && matchesDistrict;
        });
    }, [congregations, searchTerm, filterDistrict]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCongregations.length / itemsPerPage);
    const currentData = filteredCongregations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    // CRUD Ops
    const handleSave = async () => {
        if (!formData.name || !formData.district_id) {
            toast({ title: "Name and District are required", status: "warning" });
            return;
        }
        try {
            if (editingCong) {
                await axios.put(`${API_URL}/api/local-congregations/${editingCong.id}`, formData);
                toast({ title: "Updated successfully", status: "success", duration: 2000 });
            } else {
                await axios.post(`${API_URL}/api/local-congregations`, formData);
                toast({ title: "Added successfully", status: "success", duration: 2000 });
            }
            fetchInitialData();
            onClose();
        } catch (error) {
            toast({ title: "Operation failed", status: "error", duration: 3000 });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this congregation?")) return;
        try {
            await axios.delete(`${API_URL}/api/local-congregations/${id}`);
            toast({ title: "Deleted", status: "success", duration: 2000 });
            setCongregations(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            toast({ title: "Delete failed", status: "error", duration: 3000 });
        }
    };

    const openModal = (cong = null) => {
        setEditingCong(cong);
        setFormData(cong ? {
            name: cong.name,
            district_id: cong.district_id,
            latitude: cong.latitude || "",
            longitude: cong.longitude || "",
            address: cong.address || ""
        } : {
            name: "", district_id: "", latitude: "", longitude: "", address: ""
        });
        onOpen();
    };

    const getDistrictName = (id) => {
        const d = districts.find(d => d.id === id);
        return d ? d.name : "Unknown";
    };

    return (
        <Box h="100vh" bg="gray.50" display="flex" flexDirection="column" overflow="hidden">
            {/* 🟢 FIXED HEADER */}
            <Box bg="white" shadow="sm" borderBottom="1px solid" borderColor="gray.200" py={2} flexShrink={0} zIndex={10}>
                <Container maxW="full" px={{ base: 2, md: 6 }}>
                    <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                        <Flex align="center" gap={3} flexShrink={0}>
                            <IconButton
                                icon={<FaHome />}
                                variant="ghost"
                                onClick={() => navigate("/")}
                                aria-label="Home"
                                size="sm"
                            />
                            <Heading size="md" color="gray.800" display="flex" alignItems="center" gap={2}>
                                Congregations
                                <Badge colorScheme="purple" fontSize="0.8em" borderRadius="full">{congregations.length}</Badge>
                            </Heading>
                        </Flex>

                        <Flex gap={2} align="center" flexWrap="nowrap" overflowX="auto" pb={{ base: 1, md: 0 }}>
                            {/* Search & Filters Compact */}
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                size="sm"
                                w={{ base: "120px", md: "200px" }}
                                variant="filled"
                                borderRadius="md"
                            />
                            <Select
                                placeholder="Districts"
                                value={filterDistrict}
                                onChange={(e) => { setFilterDistrict(e.target.value); setCurrentPage(1); }}
                                size="sm"
                                w={{ base: "100px", md: "150px" }}
                                variant="filled"
                                borderRadius="md"
                                icon={<FaFilter />}
                            >
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </Select>

                            <ButtonGroup isAttached variant="outline" size="xs">
                                <IconButton
                                    aria-label="List View"
                                    icon={<FaList />}
                                    colorScheme={!isGridView ? "purple" : "gray"}
                                    variant={!isGridView ? "solid" : "outline"}
                                    onClick={() => setIsGridView(false)}
                                />
                                <IconButton
                                    aria-label="Grid View"
                                    icon={<FaTh />}
                                    colorScheme={isGridView ? "purple" : "gray"}
                                    variant={isGridView ? "solid" : "outline"}
                                    onClick={() => setIsGridView(true)}
                                />
                            </ButtonGroup>

                            <Tooltip label="Refresh">
                                <IconButton size="sm" icon={<FaSyncAlt />} onClick={fetchInitialData} aria-label="Refresh" variant="ghost" />
                            </Tooltip>
                            <Button size="sm" leftIcon={<FaPlus />} colorScheme="blue" onClick={() => openModal()} display={{ base: "none", sm: "flex" }}>
                                New
                            </Button>
                            <IconButton size="sm" icon={<FaPlus />} colorScheme="blue" onClick={() => openModal()} display={{ base: "flex", sm: "none" }} aria-label="New" />
                        </Flex>
                    </Flex>
                </Container>
            </Box>

            {/* 🟡 SCROLLABLE CONTENT */}
            <Container maxW="full" px={{ base: 2, md: 6 }} flex="1" display="flex" flexDirection="column" overflow="hidden" py={4}>
                {loading ? (
                    <Stack spacing={2}>
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height="40px" borderRadius="md" />)}
                    </Stack>
                ) : (
                    <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                        <Box flex="1" overflowY="auto" pr={1} pb={2} css={{
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                            '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '4px' },
                            '&::-webkit-scrollbar-thumb:hover': { background: '#a8a8a8' },
                        }}>
                            {isGridView ? (
                                // GRID VIEW
                                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5, xl: 6 }} spacing={3}>
                                    {currentData.map((c) => (
                                        <Card key={c.id} bg={cardBg} shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s" size="sm" borderWidth="1px" borderColor="gray.100">
                                            <CardBody>
                                                <Heading size="xs" color="blue.600" mb={1} noOfLines={1} title={c.name}>{c.name}</Heading>
                                                <Badge mb={2} colorScheme="purple" fontSize="0.7em" noOfLines={1}>{getDistrictName(c.district_id)}</Badge>
                                                <Text fontSize="xs" color="gray.500" display="flex" alignItems="center" gap={1} mb={3}>
                                                    <FaMapMarkerAlt /> {c.latitude && c.longitude ? 'Set' : 'N/A'}
                                                </Text>
                                                <Flex justify="flex-end" gap={1}>
                                                    <IconButton size="xs" icon={<FaEdit />} onClick={() => openModal(c)} aria-label="Edit" variant="ghost" colorScheme="yellow" />
                                                    <IconButton size="xs" icon={<FaTrash />} colorScheme="red" onClick={() => handleDelete(c.id)} aria-label="Delete" variant="ghost" />
                                                </Flex>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    {currentData.length === 0 && <Text textAlign="center" gridColumn="1/-1" color="gray.500" mt={10}>No congregations found.</Text>}
                                </SimpleGrid>
                            ) : (
                                // LIST VIEW
                                <Box bg="white" borderRadius="md" shadow="sm" border="1px solid" borderColor="gray.200" overflowX="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                                            <Tr>
                                                <Th py={3}>Name</Th>
                                                <Th>District</Th>
                                                <Th>Coords</Th>
                                                <Th isNumeric>Actions</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {currentData.map((c) => (
                                                <Tr key={c.id} _hover={{ bg: "blue.50" }}>
                                                    <Td py={2} fontWeight="medium" color="blue.600">{c.name}</Td>
                                                    <Td py={2}><Badge colorScheme="purple" variant="outline" fontSize="xs">{getDistrictName(c.district_id)}</Badge></Td>
                                                    <Td py={2} fontSize="xs" color="gray.500">
                                                        {c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : <Text color="gray.300">N/A</Text>}
                                                    </Td>
                                                    <Td py={2} isNumeric>
                                                        <ButtonGroup size="xs" variant="ghost">
                                                            <IconButton icon={<FaEdit />} colorScheme="blue" onClick={() => openModal(c)} aria-label="Edit" />
                                                            <IconButton icon={<FaTrash />} colorScheme="red" onClick={() => handleDelete(c.id)} aria-label="Delete" />
                                                        </ButtonGroup>
                                                    </Td>
                                                </Tr>
                                            ))}
                                            {currentData.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">No data matches your filters.</Td></Tr>}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </Box>

                        {/* FIXED FOOTER */}
                        <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor="gray.200" bg="gray.50" flexShrink={0}>
                            <Text fontSize="xs" color="gray.500">
                                {currentData.length} records
                            </Text>
                            <Flex align="center" gap={2}>
                                <Text fontSize="xs" color="gray.500" mr={2}>
                                    Pg {currentPage}/{totalPages}
                                </Text>
                                <ButtonGroup size="xs" isAttached variant="outline" bg="white">
                                    <IconButton
                                        icon={<FaChevronLeft />}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        isDisabled={currentPage === 1}
                                        aria-label="Previous"
                                    />
                                    <IconButton
                                        icon={<FaChevronRight />}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        isDisabled={currentPage === totalPages}
                                        aria-label="Next"
                                    />
                                </ButtonGroup>
                            </Flex>
                        </Flex>
                    </Box>
                )}

                {/* Modal Form */}
                <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
                    <ModalOverlay backdropFilter="blur(2px)" />
                    <ModalContent borderRadius="lg">
                        <ModalHeader fontSize="md">{editingCong ? "Edit Congregation" : "New Congregation"}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Stack spacing={3}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">Congregation Name</FormLabel>
                                    <Input
                                        size="sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Locale of Central"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">District</FormLabel>
                                    <Select
                                        size="sm"
                                        placeholder="Select District"
                                        value={formData.district_id}
                                        onChange={(e) => setFormData({ ...formData, district_id: parseInt(e.target.value) })}
                                    >
                                        {districts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <SimpleGrid columns={2} spacing={3}>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Latitude</FormLabel>
                                        <Input
                                            size="sm"
                                            type="number"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            placeholder="0.0000"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Longitude</FormLabel>
                                        <Input
                                            size="sm"
                                            type="number"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            placeholder="0.0000"
                                        />
                                    </FormControl>
                                </SimpleGrid>
                            </Stack>
                        </ModalBody>
                        <ModalFooter bg="gray.50" borderBottomRadius="lg" py={2}>
                            <Button size="sm" variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                            <Button size="sm" colorScheme="blue" onClick={handleSave}>Save</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Container>
        </Box>
    );
};

export default LocalCongregations;
