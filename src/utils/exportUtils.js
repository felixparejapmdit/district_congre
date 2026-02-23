import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportLocaleToPDF = (locale, districtName) => {
    const doc = jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Premium Header
    doc.setFillColor(43, 108, 176); // blue.600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(locale.name.toUpperCase(), 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const districtText = `DISTRICT OF ${districtName?.toUpperCase() || 'UNKNOWN'}`;
    doc.text(districtText, 15, 30);

    // Body Branding
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('OFFICIAL LOCALE PROFILE REPORT', 15, 48);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 50, 195, 50);

    // Section: BASIC INFORMATION
    autoTable(doc, {
        startY: 55,
        head: [['BASIC INFORMATION', '']],
        body: [
            ['STREET ADDRESS', locale.address?.toUpperCase() || 'NOT AVAILABLE'],
            ['CONTACT', (locale.contact || 'N/A').replace(/<br\s*\/?>/gi, " | ").replace(/<[^>]+>/g, '').trim()],
            ['REGION/DISTRICT', districtName?.toUpperCase() || 'N/A'],
        ],
        theme: 'plain',
        headStyles: { textColor: [43, 108, 176], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold', textColor: [100, 100, 100] },
            1: { halign: 'left' }
        }
    });

    // Section: PROXIMITY & TIMEZONE
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['LOCATION & LOGISTICS', '']],
        body: [
            ['AIR DISTANCE', locale.air_distance || '---'],
            ['ROAD DISTANCE', locale.road_distance || '---'],
            ['TRAVEL TIME', locale.travel_time || '---'],
            ['TIMEZONE', locale.timezone_diff || 'SAME AS PH'],
        ],
        theme: 'plain',
        headStyles: { textColor: [43, 108, 176], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold', textColor: [100, 100, 100] },
            1: { halign: 'left' }
        }
    });

    // Section: WORSHIP SCHEDULE
    const parseSchedule = (html) => {
        if (!html) return [['N/A', 'N/A', 'N/A']];

        // Remove disclaimers and clean text
        let cleanText = html
            .replace(/Worship Service Schedule/gi, "")
            .replace(/Be sure to confirm.*?before attending\./gi, "")
            .replace(/Worship service times may be temporarily or recently changed\./gi, "");

        const dayMap = {};
        const daysInOrder = [];

        // Multi-stage parsing
        // 1. Identify Day blocks
        const dayRegex = /<h6>([^<]+)<\/h6>(.*?)(?=<h6>|$)/gs;
        let dayMatch;
        let foundStructured = false;

        while ((dayMatch = dayRegex.exec(cleanText)) !== null) {
            const day = dayMatch[1].trim().toUpperCase();
            const content = dayMatch[2];

            // 2. Find chips (Time + Lang)
            // Chips can be div or span
            const chipRegex = /<(?:div|span)[^>]*class="chip"[^>]*>(.*?)<\/(?:div|span)>/gs;
            let chipMatch;

            if (!dayMap[day]) {
                dayMap[day] = [];
                daysInOrder.push(day);
            }

            while ((chipMatch = chipRegex.exec(content)) !== null) {
                foundStructured = true;
                const inner = chipMatch[1];

                // Extract Time: text before any tags
                let time = inner.split('<')[0].trim().toUpperCase().replace(/\s/g, '');

                // Extract Language: text inside subchip
                const subchipMatch = inner.match(/class="subchip[^>]*>(.*?)<\/div>/i);
                let lang = "TAGALOG";
                if (subchipMatch) {
                    lang = subchipMatch[1].replace(/<[^>]+>/g, '').trim().toUpperCase();
                } else if (inner.includes(' ')) {
                    // Fallback for flat text inside chip
                    const parts = inner.replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
                    if (parts.length > 1) {
                        time = parts[0];
                        lang = parts.slice(1).join(" ");
                    }
                }

                if (time) dayMap[day].push({ time, lang });
            }
        }

        // Strategy 2: Flat Text fallback
        if (!foundStructured || Object.keys(dayMap).length === 0) {
            const plainText = cleanText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
            const textPattern = /(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{1,2}:\d{2}\s?(?:AM|PM))\s*(.*?)(?=(?:SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)|$)/gi;

            let match;
            while ((match = textPattern.exec(plainText)) !== null) {
                const day = match[1].trim().toUpperCase();
                const time = match[2].trim().replace(/\s/g, '');
                const lang = (match[3] || "TAGALOG").trim().toUpperCase();

                if (!dayMap[day]) {
                    dayMap[day] = [];
                    daysInOrder.push(day);
                }
                dayMap[day].push({ time, lang });
            }
        }

        // Convert Map to Rows with comma separation
        const rows = daysInOrder.map(day => {
            const entries = dayMap[day];
            if (entries.length === 0) return null;

            const times = entries.map(e => e.time).join(", ");
            const uniqueLangs = [...new Set(entries.map(e => e.lang))];
            const langs = uniqueLangs.join(", ");
            return [day, times, langs];
        }).filter(r => r !== null);

        if (rows.length === 0) {
            const finalClean = cleanText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (finalClean && finalClean.length > 5) {
                rows.push(['SCHEDULE', finalClean.toUpperCase(), '']);
            } else {
                return [['N/A', 'N/A', 'N/A']];
            }
        }

        return rows;
    };

    const scheduleRows = parseSchedule(locale.schedule);

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['DAY', 'TIME', 'LANGUAGE']],
        body: scheduleRows,
        theme: 'grid',
        headStyles: {
            fillColor: [43, 108, 176],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            halign: 'left',
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold', textColor: [43, 108, 176] },
            1: { cellWidth: 45 },
            2: { cellWidth: 'auto' }
        },
        margin: { top: 15 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(`ATG SYSTEM REPORT | GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 15, 285);
        doc.text(`PAGE ${i} OF ${pageCount}`, 185, 285);
    }

    doc.save(`${locale.name}_Report.pdf`);
};
