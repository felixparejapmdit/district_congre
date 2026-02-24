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
    useColorModeValue,
    useColorMode,
    Skeleton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Input,
    InputGroup,
    InputLeftElement,
    Badge,
    Divider,
    Spinner,
    IconButton,
    Tooltip,
    Link
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGlobeAsia, FaMapMarkerAlt, FaPlusCircle, FaSync, FaChartPie, FaChartLine, FaBuilding, FaUsers, FaSearch, FaMapMarkedAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from "axios";

const envApiUrl = process.env.REACT_APP_API_URL || "";
const API_BASE = (envApiUrl === "/" ? "" : (envApiUrl || "http://localhost:3001")) + "/api";

const Dashboard = () => {
    const [stats, setStats] = useState({
        districtCount: 0,
        congregationCount: 0,
        extensionCount: 0,
        gwsCount: 0,
        regionalStats: [],
        syncHistory: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { colorMode } = useColorMode();

    // Sub-locale modal state
    const [subModal, setSubModal] = useState({ open: false, type: 'ext', title: '' });
    const [subList, setSubList] = useState([]);
    const [subSummary, setSubSummary] = useState(null);
    const [subLoading, setSubLoading] = useState(false);
    const [subSearch, setSubSearch] = useState('');

    const openSubLocaleModal = async (type) => {
        const title = type === 'gws' ? 'Group Worship Services (GWS)' : 'Extension Locales (Ext.)';
        setSubModal({ open: true, type, title });
        setSubSearch('');
        setSubSummary(null);
        setSubLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/dashboard/sub-locales?type=${type}`);
            setSubList(data.rows || []);
            setSubSummary(data.summary || null);
        } catch { setSubList([]); setSubSummary(null); }
        finally { setSubLoading(false); }
    };

    const filteredSubList = subList.filter(l =>
        l.name.toLowerCase().includes(subSearch.toLowerCase()) ||
        l.district.toLowerCase().includes(subSearch.toLowerCase()) ||
        l.region.toLowerCase().includes(subSearch.toLowerCase())
    );

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
    const overlayColor = useColorModeValue("rgba(255,255,255,0.55)", "rgba(0,0,0,0.75)");
    const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(15,20,40,0.85)");
    const darkCardBg = useColorModeValue("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)");
    const titleColor = useColorModeValue("blue.800", "white");
    const statLabelColor = useColorModeValue("gray.500", "gray.400");
    const statNumColor = useColorModeValue("blue.600", "blue.300");
    const emeraldStatColor = useColorModeValue("green.600", "green.300");
    const statHelpTextBlue = useColorModeValue("blue.400", "blue.300");
    const statHelpTextGreen = useColorModeValue("green.400", "green.300");
    const contrastText = useColorModeValue("gray.800", "white");
    const subTitleColor = useColorModeValue("blue.600", "blue.200");
    const districtBorderColor = useColorModeValue("blue.100", "blue.800");
    const localeBorderColor = useColorModeValue("green.100", "green.900");
    const dataMgmtBorderColor = useColorModeValue("orange.100", "orange.900");
    const dataMgmtLabelColor = useColorModeValue("gray.500", "gray.400");
    const cardFooterBlue = useColorModeValue("blue.600", "blue.300");
    const cardFooterGreen = useColorModeValue("green.600", "green.300");
    const syncBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
    const syncHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
    const blurEffect = "blur(15px)";

    return (
        <>
            <Box
                w="100%"
                h="calc(100vh - 58px)"
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
                                            <StatLabel fontWeight="black" color={statLabelColor} fontSize="sm">TOTAL DISTRICTS</StatLabel>
                                            <Skeleton isLoaded={!loading} h="60px" w="120px" mx="auto" mt={2}>
                                                <StatNumber fontSize="5xl" fontWeight="black" color={statNumColor}>
                                                    {stats.districtCount.toLocaleString()}
                                                </StatNumber>
                                            </Skeleton>
                                            <StatHelpText color={statHelpTextBlue} fontWeight="bold">
                                                Across the Globe
                                            </StatHelpText>
                                        </Stat>
                                        <Text fontSize="xs" fontWeight="black" color={cardFooterBlue} textTransform="uppercase">
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
                                            <StatLabel fontWeight="black" color={statLabelColor} fontSize="sm">LOCAL CONGREGATIONS</StatLabel>
                                            <Skeleton isLoaded={!loading} h="60px" w="160px" mx="auto" mt={2}>
                                                <StatNumber
                                                    fontSize="4xl"
                                                    fontWeight="black"
                                                    color={emeraldStatColor}
                                                    whiteSpace="nowrap"
                                                    letterSpacing="tight"
                                                >
                                                    {stats.congregationCount.toLocaleString()}
                                                </StatNumber>
                                            </Skeleton>
                                            <StatHelpText color={statHelpTextGreen} fontWeight="bold">
                                                Officially Registered
                                            </StatHelpText>
                                        </Stat>
                                        <Text fontSize="xs" fontWeight="black" color={cardFooterGreen} textTransform="uppercase">
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

                        {/* SUB-LOCALE INFO STRIP */}
                        <Box
                            as={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            w="100%"
                        >
                            <Flex
                                bg={cardBg}
                                backdropFilter={blurEffect}
                                borderRadius="2xl"
                                border="1px solid"
                                borderColor={localeBorderColor}
                                px={6}
                                py={4}
                                justify="center"
                                align="center"
                                gap={8}
                                flexWrap="wrap"
                            >
                                <Text fontSize="xs" fontWeight="black" color={statLabelColor} letterSpacing="widest">
                                    SUB-LOCALES TRACKED
                                </Text>
                                <HStack
                                    spacing={3}
                                    cursor="pointer"
                                    p={2}
                                    borderRadius="xl"
                                    _hover={{ bg: 'orange.50' }}
                                    transition="background 0.2s"
                                    onClick={() => openSubLocaleModal('ext')}
                                    title="Click to view list"
                                >
                                    <Box p={2} bg="orange.500" borderRadius="lg" color="white">
                                        <Icon as={FaBuilding} boxSize={3} />
                                    </Box>
                                    <VStack spacing={0} align="start">
                                        <Text fontSize="xs" fontWeight="black" color={statLabelColor}>EXTENSION LOCALES (Ext.)</Text>
                                        <Skeleton isLoaded={!loading} h="20px" w="40px">
                                            <Text fontSize="lg" fontWeight="black" color="orange.500">
                                                {stats.extensionCount.toLocaleString()}
                                            </Text>
                                        </Skeleton>
                                    </VStack>
                                </HStack>
                                <Box w="1px" h="40px" bg={districtBorderColor} display={{ base: 'none', md: 'block' }} />
                                <HStack
                                    spacing={3}
                                    cursor="pointer"
                                    p={2}
                                    borderRadius="xl"
                                    _hover={{ bg: 'purple.50' }}
                                    transition="background 0.2s"
                                    onClick={() => openSubLocaleModal('gws')}
                                    title="Click to view list"
                                >
                                    <Box p={2} bg="purple.500" borderRadius="lg" color="white">
                                        <Icon as={FaUsers} boxSize={3} />
                                    </Box>
                                    <VStack spacing={0} align="start">
                                        <Text fontSize="xs" fontWeight="black" color={statLabelColor}>GROUP WORSHIP SERVICES (GWS)</Text>
                                        <Skeleton isLoaded={!loading} h="20px" w="40px">
                                            <Text fontSize="lg" fontWeight="black" color="purple.500">
                                                {stats.gwsCount.toLocaleString()}
                                            </Text>
                                        </Skeleton>
                                    </VStack>
                                </HStack>
                                <Box w="1px" h="40px" bg={districtBorderColor} display={{ base: 'none', md: 'block' }} />
                                <VStack spacing={0} align="center">
                                    <Text fontSize="xs" fontWeight="black" color={statLabelColor}>TOTAL INCL. SUB-LOCALES</Text>
                                    <Skeleton isLoaded={!loading} h="20px" w="60px">
                                        <Text fontSize="lg" fontWeight="black" color={titleColor}>
                                            {(stats.congregationCount + stats.extensionCount + stats.gwsCount).toLocaleString()}
                                        </Text>
                                    </Skeleton>
                                </VStack>
                            </Flex>
                        </Box>

                        <Box
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            bg={cardBg}
                            backdropFilter={blurEffect}
                            p={6}
                            borderRadius="3xl"
                            shadow="xl"
                            border="1px solid"
                            borderColor={districtBorderColor}
                            w="100%"
                            minH="450px"
                        >
                            <VStack h="100%" spacing={6} align="stretch">
                                <HStack w="100%" justify="space-between">
                                    <HStack>
                                        <Icon as={FaChartPie} color="blue.400" />
                                        <Text fontWeight="black" fontSize="md" color={titleColor}>REGIONAL DISTRIBUTION</Text>
                                    </HStack>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.400">Congregations per Region</Text>
                                </HStack>
                                <Skeleton isLoaded={!loading} w="100%" h="350px" borderRadius="xl">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={stats.regionalStats}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={140}
                                                fontSize={10}
                                                fontWeight="bold"
                                                tick={{ fill: titleColor }}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            />
                                            <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                                                {stats.regionalStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Skeleton>
                            </VStack>
                        </Box>
                    </VStack>
                </Flex>
            </Box>

            {/* Sub-Locale List Modal */}
            <SubLocaleModal
                isOpen={subModal.open}
                onClose={() => setSubModal(m => ({ ...m, open: false }))}
                title={subModal.title}
                type={subModal.type}
                list={filteredSubList}
                summary={subSummary}
                loading={subLoading}
                search={subSearch}
                onSearch={setSubSearch}
            />
        </>
    );
};

// ─── Sub-Locale Modal ────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

const SubLocaleModal = ({ isOpen, onClose, title, type, list, summary, loading, search, onSearch }) => {
    const accentColor = type === 'gws' ? 'purple' : 'orange';
    const accentHex = type === 'gws' ? '#6B46C1' : '#DD6B20';
    const headerBg = type === 'gws'
        ? 'linear-gradient(135deg, #6B46C1, #9F7AEA)'
        : 'linear-gradient(135deg, #DD6B20, #F6AD55)';

    const [page, setPage] = React.useState(1);

    // Reset to page 1 whenever search changes
    React.useEffect(() => { setPage(1); }, [search]);
    // Reset to page 1 when modal opens
    React.useEffect(() => { if (isOpen) setPage(1); }, [isOpen]);

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const pageStart = (page - 1) * PAGE_SIZE;
    const pageItems = list.slice(pageStart, pageStart + PAGE_SIZE);

    const mapsUrl = (locale) => {
        const q = encodeURIComponent(`${locale.name} ${locale.district} Philippines`);
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
            <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>

                {/* Gradient Header */}
                <Box bg={headerBg} px={6} pt={6} pb={4} color="white" position="relative">
                    <ModalCloseButton color="white" top={4} right={4} _hover={{ bg: 'whiteAlpha.300' }} borderRadius="full" />
                    <HStack spacing={3} mb={1}>
                        <Icon as={type === 'gws' ? FaUsers : FaBuilding} boxSize={5} />
                        <Text fontSize="xl" fontWeight="black" letterSpacing="wide">{title.toUpperCase()}</Text>
                    </HStack>
                    <Text fontSize="xs" opacity={0.8} fontWeight="bold" mb={summary ? 3 : 0}>
                        {loading ? 'Loading...' : `${list.length} records • IDs preserved in database`}
                    </Text>
                    {/* Accuracy summary pills */}
                    {!loading && summary && (
                        <HStack spacing={3} flexWrap="wrap">
                            <HStack
                                spacing={1} px={2} py={1}
                                bg="whiteAlpha.200" borderRadius="full"
                            >
                                <Box w={2} h={2} bg="green.300" borderRadius="full" />
                                <Text fontSize="10px" fontWeight="black">
                                    {summary.underActiveDistrict} under active district
                                </Text>
                            </HStack>
                            {summary.underInactiveDistrict > 0 && (
                                <HStack
                                    spacing={1} px={2} py={1}
                                    bg="whiteAlpha.200" borderRadius="full"
                                >
                                    <Box w={2} h={2} bg="yellow.300" borderRadius="full" />
                                    <Text fontSize="10px" fontWeight="black">
                                        {summary.underInactiveDistrict} under retired district ⚠
                                    </Text>
                                </HStack>
                            )}
                        </HStack>
                    )}
                </Box>

                {/* Search */}
                <ModalHeader pt={4} pb={2} px={6}>
                    <InputGroup size="sm">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FaSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search by name, district, or region..."
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            borderRadius="xl"
                            bg="gray.50"
                            color="black"
                            _placeholder={{ color: 'gray.400' }}
                            fontSize="sm"
                        />
                    </InputGroup>
                </ModalHeader>

                {/* Body */}
                <ModalBody px={0} pb={0}>
                    {loading ? (
                        <Flex justify="center" py={16}>
                            <VStack spacing={3}>
                                <Spinner size="xl" color={`${accentColor}.500`} thickness="4px" />
                                <Text color="gray.500" fontSize="sm" fontWeight="bold">Loading records...</Text>
                            </VStack>
                        </Flex>
                    ) : list.length === 0 ? (
                        <Flex justify="center" py={16}>
                            <Text color="gray.400" fontWeight="bold">No records found.</Text>
                        </Flex>
                    ) : (
                        <Box>
                            {/* Column Headers */}
                            <HStack
                                px={6} py={2}
                                bg="gray.50"
                                borderBottom="1px solid"
                                borderColor="gray.200"
                                position="sticky"
                                top={0}
                                zIndex={1}
                            >
                                <Text flex="3" fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="wider"># &nbsp; NAME</Text>
                                <Text flex="2" fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="wider">DISTRICT</Text>
                                <Text flex="1.5" fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="wider">REGION</Text>
                                <Text w="52px" fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="wider" textAlign="center">ACTION</Text>
                            </HStack>

                            {/* Rows */}
                            {pageItems.map((l, i) => (
                                <Box key={l.id}>
                                    <HStack
                                        px={6} py={2}
                                        _hover={{ bg: `${accentColor}.50` }}
                                        transition="background 0.15s"
                                        align="center"
                                    >
                                        <HStack flex="3" spacing={3} minW={0}>
                                            <Text fontSize="10px" fontWeight="black" color="gray.300" minW="28px" textAlign="right">
                                                {pageStart + i + 1}
                                            </Text>
                                            <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{l.name}</Text>
                                        </HStack>
                                        <Box flex="2" minW={0}>
                                            <HStack spacing={1} align="center">
                                                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                                    {l.district}
                                                </Text>
                                                {l.districtActive === false && (
                                                    <Tooltip
                                                        label="This district was retired from the official INC directory"
                                                        placement="top"
                                                        hasArrow
                                                        bg="yellow.500"
                                                        color="black"
                                                    >
                                                        <Text fontSize="10px" color="yellow.500" cursor="help" flexShrink={0}>⚠</Text>
                                                    </Tooltip>
                                                )}
                                            </HStack>
                                        </Box>
                                        <Box flex="1.5">
                                            <Badge
                                                colorScheme={accentColor}
                                                borderRadius="full"
                                                px={2}
                                                fontSize="9px"
                                                fontWeight="black"
                                                whiteSpace="nowrap"
                                            >
                                                {l.region || '—'}
                                            </Badge>
                                        </Box>
                                        {/* Action: open Google Maps search */}
                                        <Box w="52px" display="flex" justifyContent="center">
                                            <Tooltip label="Search on Google Maps" placement="top" hasArrow>
                                                <IconButton
                                                    as={Link}
                                                    href={mapsUrl(l)}
                                                    isExternal
                                                    icon={<Icon as={FaMapMarkedAlt} />}
                                                    size="xs"
                                                    colorScheme={accentColor}
                                                    variant="ghost"
                                                    borderRadius="full"
                                                    aria-label="Open Maps"
                                                    _hover={{ bg: `${accentColor}.100`, color: accentHex }}
                                                />
                                            </Tooltip>
                                        </Box>
                                    </HStack>
                                    {i < pageItems.length - 1 && <Divider opacity={0.3} />}
                                </Box>
                            ))}
                        </Box>
                    )}
                </ModalBody>

                {/* Pagination Footer */}
                {!loading && list.length > 0 && (
                    <ModalFooter
                        borderTop="1px solid"
                        borderColor="gray.100"
                        py={3}
                        px={6}
                        justifyContent="space-between"
                    >
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, list.length)} of {list.length}
                        </Text>
                        <HStack spacing={2}>
                            <IconButton
                                icon={<Icon as={FaChevronLeft} />}
                                size="xs"
                                borderRadius="full"
                                isDisabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                colorScheme={accentColor}
                                variant="ghost"
                                aria-label="Previous page"
                            />
                            <Text fontSize="xs" fontWeight="black" color="gray.600" minW="60px" textAlign="center">
                                Page {page} / {totalPages}
                            </Text>
                            <IconButton
                                icon={<Icon as={FaChevronRight} />}
                                size="xs"
                                borderRadius="full"
                                isDisabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                colorScheme={accentColor}
                                variant="ghost"
                                aria-label="Next page"
                            />
                        </HStack>
                    </ModalFooter>
                )}
            </ModalContent>
        </Modal>
    );
};

export default Dashboard;


