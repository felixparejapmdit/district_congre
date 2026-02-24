const { District, LocalCongregation, SyncHistory } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

exports.getStats = async (req, res) => {
    try {
        // 1. Active district count (only those with at least one active locale)
        const districtCount = await District.count({
            distinct: true,
            where: { is_active: true },
            include: [{
                model: LocalCongregation,
                required: true,
                where: { is_active: true }
            }]
        });

        // 2. Active locale count (Official Total Locales)
        //    Includes everything currently listed on the official directory site
        const congregationCount = await LocalCongregation.count({
            where: { is_active: true },
            include: [{
                model: District,
                where: { is_active: true },
                required: true,
                attributes: []
            }]
        });

        // 3. Total Extensions recorded (Active and Inactive)
        const extensionCount = await LocalCongregation.count({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%Ext.%' } },
                    { name: { [Op.like]: '%Extension%' } }
                ]
            }
        });

        // 3b. Active Extensions (part of the official total)
        const activeExtensionCount = await LocalCongregation.count({
            where: {
                is_active: true,
                [Op.or]: [
                    { name: { [Op.like]: '%Ext.%' } },
                    { name: { [Op.like]: '%Extension%' } }
                ]
            },
            include: [{ model: District, where: { is_active: true }, required: true }]
        });

        // 4. Total GWS recorded (Active and Inactive)
        const gwsCount = await LocalCongregation.count({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%GWS%' } },
                    { name: { [Op.like]: '%Group Worship%' } }
                ]
            }
        });

        // 4b. Active GWS (part of the official total)
        const activeGwsCount = await LocalCongregation.count({
            where: {
                is_active: true,
                [Op.or]: [
                    { name: { [Op.like]: '%GWS%' } },
                    { name: { [Op.like]: '%Group Worship%' } }
                ]
            },
            include: [{ model: District, where: { is_active: true }, required: true }]
        });



        // 6. Regional Stats for Pie Chart (active locales under active districts)
        const regionalData = await District.findAll({
            attributes: [
                'region',
                [sequelize.fn('COUNT', sequelize.col('LocalCongregations.id')), 'count']
            ],
            where: { is_active: true },
            include: [{
                model: LocalCongregation,
                attributes: [],
                required: true,
                where: { is_active: true }
            }],
            group: ['region'],
            raw: true
        });

        const regionalStats = regionalData.map(r => ({
            name: r.region || "Unknown",
            value: parseInt(r.count)
        }));

        // 7. Sync History for Timeline Graph (last 10 completed runs)
        const syncHistory = await SyncHistory.findAll({
            where: { status: 'completed' },
            order: [['id', 'DESC']],
            limit: 10
        });

        res.status(200).json({
            districtCount,
            congregationCount,
            extensionCount,
            activeExtensionCount,
            gwsCount,
            activeGwsCount,
            regionalStats,
            syncHistory: syncHistory.reverse()
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Error retrieving dashboard statistics", error: error.message });
    }
};

// GET /api/dashboard/sub-locales?type=ext|gws&search=...
exports.getSubLocales = async (req, res) => {
    try {
        const type = req.query.type || 'ext';
        const search = req.query.search || '';

        let baseFilter;
        if (type === 'gws') {
            baseFilter = { [Op.or]: [{ [Op.like]: '%GWS%' }, { [Op.like]: '%Group Worship%' }] };
        } else {
            baseFilter = { [Op.like]: '%Ext.%' };
        }

        const nameWhere = search
            ? { [Op.and]: [baseFilter, { [Op.like]: `%${search}%` }] }
            : baseFilter;

        const locales = await LocalCongregation.findAll({
            where: { name: nameWhere },
            // Include district with is_active so we can flag stale district references
            include: [{ model: District, attributes: ['name', 'region', 'is_active'], required: false }],
            order: [['name', 'ASC']],
            limit: 1000
        });

        const rows = locales.map(l => ({
            id: l.id,
            name: l.name,
            district: l.District?.name || '—',
            region: l.District?.region || '—',
            address: l.address || null,
            districtActive: l.District ? Boolean(l.District.is_active) : null, // null = no district assigned
        }));

        // Summary stats for the header
        const summary = {
            total: rows.length,
            underActiveDistrict: rows.filter(r => r.districtActive === true).length,
            underInactiveDistrict: rows.filter(r => r.districtActive === false).length,
            noDistrict: rows.filter(r => r.districtActive === null).length,
        };

        res.status(200).json({ rows, summary });
    } catch (error) {
        console.error("Error fetching sub-locales:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};
